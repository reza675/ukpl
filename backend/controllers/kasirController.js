/**
 * =========================================================
 * CONTROLLER: KASIR / POINT OF SALE (POS)
 * =========================================================
 * Fungsi utama: prosesTransaksiKasir
 *
 * RISIKO FATAL: Kesalahan perhitungan berdampak pada
 * FINANSIAL APOTEK (stok minus, salah potong asuransi).
 *
 * CYCLOMATIC COMPLEXITY: ~22
 * (for-loop + nested if/else berlapis untuk SQA whitebox testing)
 *
 * FLOW GRAPH NODES:
 * 1. Loop keranjang (for)
 * 2. Cek obat ada di DB (if)
 * 3. Cek stok cukup (if)
 * 4. Acquire lock + delay + kurangi stok
 * 5. Hitung subtotal
 * 6. Hitung diskon member (nested if: silver/gold/platinum)
 * 7. Hitung potongan asuransi/BPJS (nested if + loop)
 * 8. Hitung PPN
 * 9. Hitung total akhir
 * 10. Validasi pembayaran (if tunai vs asuransi/bpjs)
 * 11. Catat transaksi
 * 12. Return receipt
 * =========================================================
 */

const { obatList, memberList, asuransiConfig, transaksiLog } = require("../data/mockDatabase");
const { acquireLock, simulasiProsesStok } = require("../utils/stockLock");

/**
 * prosesTransaksiKasir - Memproses transaksi kasir apotek
 *
 * @param {Object} req - Express request
 * @param {Array} req.body.keranjang - Array of { obatId, jumlah }
 * @param {string|null} req.body.memberId - ID member (opsional)
 * @param {string} req.body.metodePembayaran - tunai|asuransi|bpjs
 * @param {number} req.body.nominalBayar - Nominal uang yang dibayarkan
 * @param {Object} res - Express response
 */
async function prosesTransaksiKasir(req, res) {
  const { keranjang, memberId, metodePembayaran, nominalBayar } = req.body;

  // Array untuk menyimpan detail item yang diproses
  const itemDetail = [];
  let subtotal = 0;

  // Array untuk menyimpan lock releases (rollback jika gagal)
  const locksToRelease = [];

  try {
    // =====================================================
    // NODE 1-5: LOOP KERANJANG BELANJA (for loop)
    // =====================================================
    for (let i = 0; i < keranjang.length; i++) {
      const item = keranjang[i];
      const { obatId, jumlah } = item;

      // --------------------------------------------------
      // NODE 2: Cek obat ada di database
      // --------------------------------------------------
      const obat = obatList.find((o) => o.id === obatId);

      if (!obat) {
        // Decision: obat tidak ditemukan
        return res.status(404).json({
          success: false,
          error: {
            code: "OBAT_NOT_FOUND",
            message: `Obat dengan ID "${obatId}" tidak ditemukan dalam database.`,
            field: `keranjang[${i}].obatId`,
          },
        });
      }

      // --------------------------------------------------
      // NODE 3: Cek stok cukup
      // --------------------------------------------------
      if (obat.stok < jumlah) {
        // Decision: stok tidak cukup → TOLAK (risiko stok minus)
        return res.status(409).json({
          success: false,
          error: {
            code: "STOK_TIDAK_CUKUP",
            severity: "HIGH",
            message: `🚨 Stok obat "${obat.nama}" tidak mencukupi. Stok tersedia: ${obat.stok}, diminta: ${jumlah}.`,
            field: `keranjang[${i}].jumlah`,
            detail: {
              obatId: obat.id,
              namaObat: obat.nama,
              stokTersedia: obat.stok,
              jumlahDiminta: jumlah,
            },
          },
        });
      }

      // --------------------------------------------------
      // NODE 4: Acquire lock + simulasi delay + kurangi stok
      // (UNTUK STRESS TESTING - Race Condition Handling)
      // --------------------------------------------------
      const releaseLock = await acquireLock(obatId);
      locksToRelease.push(releaseLock);

      // Simulasi delay proses database (2 detik)
      await simulasiProsesStok(obatId, jumlah);

      // Cek ulang stok setelah lock (double-check locking)
      if (obat.stok < jumlah) {
        releaseLock();
        return res.status(409).json({
          success: false,
          error: {
            code: "STOK_RACE_CONDITION",
            severity: "CRITICAL",
            message: `🚨 RACE CONDITION: Stok obat "${obat.nama}" berubah saat diproses. Stok sekarang: ${obat.stok}, diminta: ${jumlah}. Silakan coba lagi.`,
            field: `keranjang[${i}].jumlah`,
          },
        });
      }

      // Kurangi stok secara atomik
      obat.stok -= jumlah;

      // Release lock setelah stok dikurangi
      releaseLock();

      // --------------------------------------------------
      // NODE 5: Hitung subtotal per item
      // --------------------------------------------------
      const subtotalItem = obat.harga * jumlah;
      subtotal += subtotalItem;

      itemDetail.push({
        obatId: obat.id,
        namaObat: obat.nama,
        jenisObat: obat.jenis,
        hargaSatuan: obat.harga,
        jumlah: jumlah,
        subtotalItem: subtotalItem,
        dicover_asuransi: obat.dicover_asuransi,
        dicover_bpjs: obat.dicover_bpjs,
      });
    }

    // =====================================================
    // NODE 6: HITUNG DISKON MEMBER (nested if)
    // =====================================================
    let diskonPersen = 0;
    let diskonNominal = 0;
    let memberInfo = null;

    if (memberId !== null && memberId !== undefined && memberId !== "") {
      // Cari member di database
      const member = memberList.find((m) => m.id === memberId);

      if (!member) {
        // Decision: member tidak ditemukan
        return res.status(404).json({
          success: false,
          error: {
            code: "MEMBER_NOT_FOUND",
            message: `Member dengan ID "${memberId}" tidak ditemukan.`,
            field: "memberId",
          },
        });
      }

      memberInfo = {
        id: member.id,
        nama: member.nama,
        level: member.level,
      };

      // Nested if: tentukan diskon berdasarkan level
      if (member.level === "silver") {
        diskonPersen = 5;
      } else if (member.level === "gold") {
        diskonPersen = 10;
      } else if (member.level === "platinum") {
        diskonPersen = 15;
      } else {
        // Level tidak dikenal → tanpa diskon (safety)
        diskonPersen = 0;
      }

      diskonNominal = Math.round((subtotal * diskonPersen) / 100);
    }

    // =====================================================
    // NODE 7: HITUNG POTONGAN ASURANSI / BPJS (nested if + loop)
    // =====================================================
    let totalCover = 0;
    let coverDetail = [];

    if (metodePembayaran === "asuransi") {
      // --------------------------------------------------
      // Metode: ASURANSI SWASTA
      // --------------------------------------------------
      const config = asuransiConfig.asuransi;
      let sisaMaksCover = config.maksCoverTotal;

      // Loop setiap item → cek apakah dicover asuransi
      for (let i = 0; i < itemDetail.length; i++) {
        const item = itemDetail[i];

        if (item.dicover_asuransi === true) {
          // Hitung cover untuk item ini
          let coverItem = Math.round(
            (item.subtotalItem * config.persenCover) / 100
          );

          // Cap per item
          if (coverItem > config.maksCoverPerItem) {
            coverItem = config.maksCoverPerItem;
          }

          // Cap terhadap sisa maks total
          if (coverItem > sisaMaksCover) {
            coverItem = sisaMaksCover;
          }

          // Pastikan cover tidak negatif
          if (coverItem < 0) {
            coverItem = 0;
          }

          totalCover += coverItem;
          sisaMaksCover -= coverItem;

          coverDetail.push({
            obatId: item.obatId,
            namaObat: item.namaObat,
            subtotalItem: item.subtotalItem,
            coverAmount: coverItem,
            dicover: true,
          });
        } else {
          // Item tidak dicover asuransi
          coverDetail.push({
            obatId: item.obatId,
            namaObat: item.namaObat,
            subtotalItem: item.subtotalItem,
            coverAmount: 0,
            dicover: false,
          });
        }
      }

    } else if (metodePembayaran === "bpjs") {
      // --------------------------------------------------
      // Metode: BPJS KESEHATAN
      // --------------------------------------------------
      const config = asuransiConfig.bpjs;
      let sisaMaksCover = config.maksCoverTotal;

      // Loop setiap item → cek apakah dicover BPJS
      for (let i = 0; i < itemDetail.length; i++) {
        const item = itemDetail[i];

        if (item.dicover_bpjs === true) {
          // Hitung cover BPJS untuk item ini
          let coverItem = Math.round(
            (item.subtotalItem * config.persenCover) / 100
          );

          // Cap per item (BPJS punya batas lebih rendah)
          if (coverItem > config.maksCoverPerItem) {
            coverItem = config.maksCoverPerItem;
          }

          // Cap terhadap sisa maks total
          if (coverItem > sisaMaksCover) {
            coverItem = sisaMaksCover;
          }

          if (coverItem < 0) {
            coverItem = 0;
          }

          totalCover += coverItem;
          sisaMaksCover -= coverItem;

          coverDetail.push({
            obatId: item.obatId,
            namaObat: item.namaObat,
            subtotalItem: item.subtotalItem,
            coverAmount: coverItem,
            dicover: true,
          });
        } else {
          // Item tidak dicover BPJS
          coverDetail.push({
            obatId: item.obatId,
            namaObat: item.namaObat,
            subtotalItem: item.subtotalItem,
            coverAmount: 0,
            dicover: false,
          });
        }
      }
    }
    // else: tunai → totalCover tetap 0

    // =====================================================
    // NODE 8: HITUNG PAJAK PPN 11%
    // =====================================================
    const subtotalSetelahDiskon = subtotal - diskonNominal;
    const ppnPersen = 11;
    const ppnNominal = Math.round((subtotalSetelahDiskon * ppnPersen) / 100);

    // =====================================================
    // NODE 9: HITUNG TOTAL AKHIR
    // =====================================================
    const totalAkhir = subtotalSetelahDiskon + ppnNominal - totalCover;

    // =====================================================
    // NODE 10: VALIDASI PEMBAYARAN (if tunai vs asuransi/bpjs)
    // =====================================================
    let kembalian = 0;
    let sisaBayarPasien = 0;

    if (metodePembayaran === "tunai") {
      // Pembayaran tunai → cek nominal cukup
      if (nominalBayar < totalAkhir) {
        // Decision: uang tidak cukup
        return res.status(400).json({
          success: false,
          error: {
            code: "PEMBAYARAN_KURANG",
            severity: "HIGH",
            message: `Nominal bayar (Rp ${nominalBayar.toLocaleString("id-ID")}) kurang dari total (Rp ${totalAkhir.toLocaleString("id-ID")}). Kurang: Rp ${(totalAkhir - nominalBayar).toLocaleString("id-ID")}`,
            field: "nominalBayar",
            detail: {
              totalAkhir: totalAkhir,
              nominalBayar: nominalBayar,
              kurang: totalAkhir - nominalBayar,
            },
          },
        });
      }

      kembalian = nominalBayar - totalAkhir;

    } else if (metodePembayaran === "asuransi") {
      // Asuransi → pasien bayar sisa setelah cover
      sisaBayarPasien = totalAkhir;
      // Cover sudah dihitung, sisa bayar = totalAkhir (yang sudah dikurangi cover)

    } else if (metodePembayaran === "bpjs") {
      // BPJS → pasien bayar sisa setelah cover
      sisaBayarPasien = totalAkhir;
    }

    // =====================================================
    // NODE 11: CATAT TRANSAKSI KE LOG
    // =====================================================
    const transaksi = {
      id: "TRX" + Date.now(),
      timestamp: new Date().toISOString(),
      items: itemDetail,
      subtotal: subtotal,
      member: memberInfo,
      diskon: {
        persen: diskonPersen,
        nominal: diskonNominal,
      },
      ppn: {
        persen: ppnPersen,
        nominal: ppnNominal,
      },
      asuransi: {
        metode: metodePembayaran,
        totalCover: totalCover,
        detail: coverDetail,
      },
      totalAkhir: totalAkhir,
      pembayaran: {
        metode: metodePembayaran,
        nominalBayar: metodePembayaran === "tunai" ? nominalBayar : null,
        kembalian: kembalian,
        sisaBayarPasien: sisaBayarPasien,
      },
    };

    transaksiLog.push(transaksi);

    // =====================================================
    // NODE 12: RETURN RECEIPT
    // =====================================================
    return res.status(200).json({
      success: true,
      data: {
        receipt: transaksi,
        message: "Transaksi berhasil diproses!",
        stokUpdate: itemDetail.map((item) => {
          const obat = obatList.find((o) => o.id === item.obatId);
          return {
            obatId: item.obatId,
            namaObat: item.namaObat,
            stokSebelum: obat.stok + item.jumlah,
            stokSesudah: obat.stok,
          };
        }),
      },
    });

  } catch (error) {
    // Release semua lock jika terjadi error
    locksToRelease.forEach((release) => {
      try { release(); } catch (e) { /* ignore */ }
    });

    console.error("[KASIR ERROR]", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan internal saat memproses transaksi.",
        detail: error.message,
      },
    });
  }
}

/**
 * getObatList - Mengembalikan daftar obat untuk frontend
 */
function getObatList(req, res) {
  const daftar = obatList.map((o) => ({
    id: o.id,
    nama: o.nama,
    jenis: o.jenis,
    stok: o.stok,
    harga: o.harga,
  }));

  return res.status(200).json({
    success: true,
    data: daftar,
  });
}

/**
 * getMemberList - Mengembalikan daftar member untuk frontend
 */
function getMemberList(req, res) {
  return res.status(200).json({
    success: true,
    data: memberList,
  });
}

module.exports = {
  prosesTransaksiKasir,
  getObatList,
  getMemberList,
};
