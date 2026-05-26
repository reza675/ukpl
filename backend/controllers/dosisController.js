/**
 * =========================================================
 * CONTROLLER: KALKULATOR DOSIS OBAT
 * =========================================================
 * Fungsi utama: hitungDosisObat
 *
 * RISIKO FATAL: Kesalahan kalkulasi dosis berdampak
 * langsung terhadap NYAWA PASIEN.
 *
 * CYCLOMATIC COMPLEXITY: ~25
 * (nested if/else berlapis + loop + rumus farmakologi per kategori umur)
 *
 * FLOW GRAPH NODES:
 * 1. Cari obat di database
 * 2. Klasifikasi kategori umur (5 cabang)
 * 3. Validasi jenis obat vs kategori pasien (nested)
 * 4. Cek alergi (loop + if)
 * 5. Kalkulasi dosis
 * 6. Cek batas maksimum harian
 * 7. Return hasil
 * =========================================================
 */

const { obatList } = require("../data/mockDatabase");

/**
 * hitungDosisObat - Menghitung dosis obat berdasarkan parameter pasien
 *
 * @param {Object} req - Express request
 * @param {string} req.body.namaObat - Nama obat
 * @param {number} req.body.umur - Umur pasien (0-120 tahun)
 * @param {number} req.body.beratBadan - Berat badan pasien (kg)
 * @param {string} req.body.jenisObat - Jenis obat: bebas|keras|psikotropika
 * @param {string[]} req.body.rpiAlergi - Riwayat penyakit/alergi pasien
 * @param {Object} res - Express response
 */
function hitungDosisObat(req, res) {
  const { namaObat, umur, beratBadan, jenisObat, rpiAlergi = [] } = req.body;

  // =====================================================
  // NODE 1: Cari obat di database
  // =====================================================
  const obat = obatList.find(
    (o) => o.nama.toLowerCase() === namaObat.toLowerCase()
  );

  if (!obat) {
    // Decision: obat tidak ditemukan
    return res.status(404).json({
      success: false,
      error: {
        code: "OBAT_NOT_FOUND",
        message: `Obat "${namaObat}" tidak ditemukan dalam database.`,
        field: "namaObat",
      },
    });
  }

  // Validasi kecocokan jenis obat dengan data di DB
  if (obat.jenis !== jenisObat) {
    // Decision: jenis obat tidak cocok
    return res.status(400).json({
      success: false,
      error: {
        code: "JENIS_MISMATCH",
        message: `Jenis obat tidak cocok. ${obat.nama} terdaftar sebagai "${obat.jenis}", bukan "${jenisObat}".`,
        field: "jenisObat",
      },
    });
  }

  // =====================================================
  // NODE 2: Klasifikasi kategori umur pasien
  // (5 percabangan → menentukan faktor dosis)
  // =====================================================
  let kategoriUmur = "";
  let faktorUmur = 1.0;
  let peringatanList = [];

  if (umur >= 0 && umur <= 1) {
    // BAYI (0-1 tahun) — dosis berbasis BB langsung / Rumus Fried
    kategoriUmur = "bayi";
    faktorUmur = 0.2; // Referensi informatif saja (tidak dipakai di kalkulasi)
    peringatanList.push(
      "⚠️ PERHATIAN: Pasien kategori BAYI. Dosis dihitung berbasis mg/kgBB langsung (untuk obat berdasarkan BB) atau Rumus Fried (untuk obat dosis tetap)."
    );

    // =====================================================
    // NODE 3a: Validasi jenis obat untuk BAYI (nested if)
    // =====================================================
    if (jenisObat === "keras") {
      // FATAL: Obat keras untuk bayi → TOLAK
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL_RISK",
          severity: "CRITICAL",
          message: `🚨 RISIKO FATAL: Obat "${obat.nama}" berjenis KERAS tidak boleh diberikan kepada BAYI (umur ${umur} tahun). Konsultasikan dengan dokter spesialis anak.`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    } else if (jenisObat === "psikotropika") {
      // FATAL: Psikotropika untuk bayi → TOLAK
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL_RISK",
          severity: "CRITICAL",
          message: `🚨 RISIKO FATAL: Obat "${obat.nama}" berjenis PSIKOTROPIKA dilarang keras untuk BAYI. Dapat menyebabkan depresi sistem saraf pusat yang fatal.`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    }
    // Obat bebas untuk bayi → lanjut dengan faktor 0.2

  } else if (umur >= 2 && umur <= 12) {
    // ANAK (2-12 tahun)
    kategoriUmur = "anak";
    faktorUmur = 0.5; // Referensi informatif saja
    peringatanList.push(
      "ℹ️ Pasien kategori ANAK. Dosis dihitung berbasis mg/kgBB langsung (pediatri) atau Rumus Young (untuk obat dosis tetap)."
    );

    // =====================================================
    // NODE 3b: Validasi jenis obat untuk ANAK (nested if)
    // =====================================================
    if (jenisObat === "psikotropika") {
      // FATAL: Psikotropika untuk anak → TOLAK
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL_RISK",
          severity: "CRITICAL",
          message: `🚨 RISIKO FATAL: Obat "${obat.nama}" berjenis PSIKOTROPIKA tidak boleh diberikan kepada ANAK di bawah 18 tahun (umur ${umur} tahun).`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    }

    if (jenisObat === "keras") {
      // Obat keras untuk anak → izinkan tapi beri peringatan
      peringatanList.push(
        `⚠️ PERHATIAN: Obat keras "${obat.nama}" untuk anak. Wajib dengan resep dan pengawasan dokter.`
      );
    }

  } else if (umur >= 13 && umur <= 17) {
    // REMAJA (13-17 tahun)
    kategoriUmur = "remaja";
    faktorUmur = 0.75; // Referensi informatif saja
    peringatanList.push(
      "ℹ️ Pasien kategori REMAJA. Dosis dihitung berbasis mg/kgBB (di-cap ke dosis dewasa standar) atau Rumus Young."
    );

    // =====================================================
    // NODE 3c: Validasi jenis obat untuk REMAJA (nested if)
    // =====================================================
    if (jenisObat === "psikotropika") {
      // FATAL: Psikotropika untuk remaja (<18) → TOLAK
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL_RISK",
          severity: "CRITICAL",
          message: `🚨 RISIKO FATAL: Obat "${obat.nama}" berjenis PSIKOTROPIKA tidak boleh diberikan kepada pasien di bawah 18 tahun (umur ${umur} tahun).`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    }

  } else if (umur >= 18 && umur <= 59) {
    // DEWASA (18-59 tahun)
    kategoriUmur = "dewasa";
    faktorUmur = 1.0;
    // Tidak ada peringatan khusus untuk dewasa

  } else if (umur >= 60 && umur <= 120) {
    // LANSIA (60-120 tahun)
    kategoriUmur = "lansia";
    faktorUmur = 0.8; // Digunakan aktif: koreksi penurunan klirens organ
    peringatanList.push(
      "⚠️ PERHATIAN: Pasien kategori LANSIA. Dosis diturunkan 20% (faktor 0.8) untuk kompensasi penurunan fungsi hati/ginjal."
    );

    // Peringatan tambahan untuk lansia + obat keras
    if (jenisObat === "keras") {
      peringatanList.push(
        `⚠️ Obat keras "${obat.nama}" untuk lansia memerlukan monitoring fungsi organ (hati & ginjal).`
      );
    }

    // Peringatan tambahan untuk lansia + psikotropika
    if (jenisObat === "psikotropika") {
      peringatanList.push(
        `⚠️ PERHATIAN TINGGI: Psikotropika "${obat.nama}" untuk lansia berisiko tinggi jatuh dan sedasi berlebihan. Dosis dimulai dari dosis terkecil.`
      );
      // Untuk lansia, faktor psikotropika lebih rendah
      faktorUmur = 0.5;
    }
  }

  // =====================================================
  // NODE 4: Cek riwayat alergi (loop + if)
  // =====================================================
  if (rpiAlergi.length > 0 && obat.kontraindikasi.length > 0) {
    const alergiCocok = [];

    // Loop melalui setiap alergi pasien
    for (let i = 0; i < rpiAlergi.length; i++) {
      const alergiPasien = rpiAlergi[i].toLowerCase();

      // Loop melalui setiap kontraindikasi obat
      for (let j = 0; j < obat.kontraindikasi.length; j++) {
        const kontra = obat.kontraindikasi[j].toLowerCase();

        if (alergiPasien === kontra) {
          alergiCocok.push({
            alergi: rpiAlergi[i],
            kontraindikasi: obat.kontraindikasi[j],
          });
        }
      }
    }

    // Jika ada alergi yang cocok → TOLAK (risiko fatal: anafilaksis)
    if (alergiCocok.length > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ALERGI_KONTRAINDIKASI",
          severity: "CRITICAL",
          message: `🚨 RISIKO FATAL: Pasien memiliki riwayat alergi/kondisi yang merupakan KONTRAINDIKASI obat "${obat.nama}". Pemberian obat ini dapat menyebabkan reaksi anafilaksis yang mengancam nyawa.`,
          detail: alergiCocok,
          field: "rpiAlergi",
        },
      });
    }
  }

  // =====================================================
  // NODE 5: Kalkulasi dosis (Rumus Farmakologi Valid)
  // =====================================================
  //
  // PRINSIP FARMAKOLOGI:
  // A. Obat dengan dosisPerKg (mg/kgBB):
  //    - Dosis = beratBadan × dosisPerKg
  //    - mg/kgBB sudah memperhitungkan ukuran tubuh pasien
  //      sehingga TIDAK perlu dikali faktor umur lagi
  //    - Pengecualian: Lansia dikali 0.8 (penurunan klirens organ)
  //    - Pengecualian: Remaja di-cap ke dosis dewasa standar (ref 70kg)
  //
  // B. Obat dengan dosisTetap (dosis dewasa tetap):
  //    - Bayi:        Rumus Fried  = (umurBulan / 150) × dosisDewasa
  //    - Anak/Remaja: Rumus Young  = (umur / (umur + 12)) × dosisDewasa
  //    - Dewasa:      dosisTetap langsung
  //    - Lansia:      dosisTetap × 0.8
  //
  // Referensi: Farmakope Indonesia Ed. VI, BNF for Children,
  //            WHO Model Formulary, Katzung Pharmacology
  // =====================================================
  let dosisPerPemberian;
  let metodeKalkulasi;
  let formulaDigunakan;

  if (obat.dosisPerKg > 0) {
    // ------------------------------------------------
    // METODE A: Berbasis Berat Badan (mg/kgBB)
    // ------------------------------------------------
    const dosisDasar = beratBadan * obat.dosisPerKg;

    if (kategoriUmur === "bayi") {
      // Bayi: mg/kgBB langsung — BB bayi sudah kecil
      // sehingga dosis otomatis proporsional
      dosisPerPemberian = dosisDasar;
      metodeKalkulasi = "mg_per_kgBB_pediatri";
      formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;
      peringatanList.push(
        `ℹ️ Dosis bayi: BB (${beratBadan} kg) × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg. Batas maks harian dipantau ketat.`
      );

    } else if (kategoriUmur === "anak") {
      // Anak: mg/kgBB standar — metode utama dosis pediatri
      // Ref: BNF for Children, WHO Essential Medicines List
      dosisPerPemberian = dosisDasar;
      metodeKalkulasi = "mg_per_kgBB_pediatri";
      formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;

    } else if (kategoriUmur === "remaja") {
      // Remaja: mg/kgBB, tapi di-cap ke dosis dewasa standar
      // Alasan: remaja bisa punya BB > 70 kg, namun organ
      // (terutama hati & ginjal) belum sepenuhnya matang
      const dosisDewasaRef = 70 * obat.dosisPerKg;

      if (dosisDasar > dosisDewasaRef) {
        // Cap ke dosis dewasa standar (referensi BB 70 kg)
        dosisPerPemberian = dosisDewasaRef;
        metodeKalkulasi = "mg_per_kgBB_remaja_capped";
        formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg → di-cap ke dosis dewasa standar (70 kg × ${obat.dosisPerKg} = ${dosisDewasaRef} mg)`;
        peringatanList.push(
          `⚠️ Dosis remaja (${dosisDasar} mg) melebihi referensi dewasa standar (${dosisDewasaRef} mg). Dosis di-cap ke referensi dewasa karena organ belum matang sepenuhnya.`
        );
      } else {
        dosisPerPemberian = dosisDasar;
        metodeKalkulasi = "mg_per_kgBB_remaja";
        formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;
      }

    } else if (kategoriUmur === "dewasa") {
      // Dewasa: mg/kgBB standar — dosis penuh
      dosisPerPemberian = dosisDasar;
      metodeKalkulasi = "mg_per_kgBB_dewasa";
      formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;

    } else if (kategoriUmur === "lansia") {
      // Lansia: mg/kgBB × 0.8 (koreksi penurunan klirens hati/ginjal ~20%)
      // Ref: Geriatric Pharmacology — penyesuaian empiris fungsi organ
      const dosisGeriatri = dosisDasar * 0.8;
      dosisPerPemberian = dosisGeriatri;
      metodeKalkulasi = "mg_per_kgBB_geriatri";
      formulaDigunakan = `(${beratBadan} kg × ${obat.dosisPerKg} mg/kg) × 0.8 = ${dosisGeriatri} mg (koreksi fungsi organ lansia)`;
      peringatanList.push(
        `⚠️ Dosis lansia dikurangi 20%: ${dosisDasar} mg × 0.8 = ${dosisGeriatri} mg (kompensasi penurunan fungsi hati/ginjal).`
      );

      // Jika lansia + psikotropika, faktor lebih rendah lagi (0.5)
      if (jenisObat === "psikotropika") {
        const dosisPsiko = dosisDasar * 0.5;
        dosisPerPemberian = dosisPsiko;
        formulaDigunakan = `(${beratBadan} kg × ${obat.dosisPerKg} mg/kg) × 0.5 = ${dosisPsiko} mg (koreksi geriatri + psikotropika)`;
        peringatanList.push(
          `⚠️ Dosis psikotropika lansia diturunkan lebih agresif: ${dosisDasar} mg × 0.5 = ${dosisPsiko} mg (risiko sedasi berlebihan).`
        );
      }
    }

  } else if (obat.dosisTetap && obat.dosisTetap > 0) {
    // ------------------------------------------------
    // METODE B: Dosis Tetap — Rumus Farmakologi Klasik
    // dosisTetap = dosis dewasa standar per pemberian
    // ------------------------------------------------
    const dosisDewasa = obat.dosisTetap;

    if (kategoriUmur === "bayi") {
      // RUMUS FRIED (untuk bayi < 2 tahun):
      //   Dosis Anak = (umur dalam bulan / 150) × Dosis Dewasa
      // Ref: Fried's Rule for Infants, Farmakologi Dasar & Klinik (Katzung)
      const umurBulan = Math.max(umur * 12, 1); // minimal 1 bulan
      dosisPerPemberian = (umurBulan / 150) * dosisDewasa;
      metodeKalkulasi = "rumus_fried";
      formulaDigunakan = `Rumus Fried: (${umurBulan} bulan / 150) × ${dosisDewasa} mg = ${((umurBulan / 150) * dosisDewasa).toFixed(2)} mg`;
      peringatanList.push(
        `ℹ️ Dosis bayi dihitung dengan Rumus Fried (umur ${umurBulan} bulan).`
      );

    } else if (kategoriUmur === "anak" || kategoriUmur === "remaja") {
      // RUMUS YOUNG (untuk anak 2-17 tahun):
      //   Dosis Anak = (umur / (umur + 12)) × Dosis Dewasa
      // Ref: Young's Rule for Children, Farmakope Indonesia Ed. VI
      dosisPerPemberian = (umur / (umur + 12)) * dosisDewasa;
      metodeKalkulasi = "rumus_young";
      formulaDigunakan = `Rumus Young: (${umur} / (${umur} + 12)) × ${dosisDewasa} mg = ${((umur / (umur + 12)) * dosisDewasa).toFixed(2)} mg`;
      peringatanList.push(
        `ℹ️ Dosis ${kategoriUmur} dihitung dengan Rumus Young (umur ${umur} tahun).`
      );

    } else if (kategoriUmur === "dewasa") {
      // Dewasa: gunakan dosis tetap langsung
      dosisPerPemberian = dosisDewasa;
      metodeKalkulasi = "dosis_tetap_dewasa";
      formulaDigunakan = `Dosis tetap dewasa: ${dosisDewasa} mg`;

    } else if (kategoriUmur === "lansia") {
      // Lansia: dosis dewasa × 0.8 (koreksi geriatri)
      const dosisGeriatri = dosisDewasa * 0.8;
      dosisPerPemberian = dosisGeriatri;
      metodeKalkulasi = "dosis_tetap_geriatri";
      formulaDigunakan = `Dosis geriatri: ${dosisDewasa} mg × 0.8 = ${dosisGeriatri} mg`;
      peringatanList.push(
        `⚠️ Dosis lansia dikurangi 20%: ${dosisDewasa} mg × 0.8 = ${dosisGeriatri} mg.`
      );
    }

  } else {
    // Fallback: tidak ada data dosis valid
    return res.status(500).json({
      success: false,
      error: {
        code: "DATA_ERROR",
        message: `Data dosis untuk obat "${obat.nama}" tidak valid di database.`,
        field: "namaObat",
      },
    });
  }

  // Pembulatan ke 2 desimal
  dosisPerPemberian = Math.round(dosisPerPemberian * 100) / 100;

  // Asumsi: 3 kali pemberian per hari
  const frekuensiHarian = 3;
  let dosisHarian = dosisPerPemberian * frekuensiHarian;
  dosisHarian = Math.round(dosisHarian * 100) / 100;

  // =====================================================
  // NODE 6: Cek batas maksimum harian
  // =====================================================
  let statusKeamanan = "AMAN";
  let dosisDiCap = false;

  if (dosisHarian > obat.maksDosisHarian) {
    // Dosis melebihi batas → cap ke maksimum
    const dosisHarianSebelumCap = dosisHarian;
    dosisHarian = obat.maksDosisHarian;
    dosisPerPemberian = Math.round((dosisHarian / frekuensiHarian) * 100) / 100;
    dosisDiCap = true;
    statusKeamanan = "WARNING";

    peringatanList.push(
      `⚠️ PERINGATAN DOSIS: Kalkulasi dosis harian (${dosisHarianSebelumCap} mg) MELEBIHI batas maksimum (${obat.maksDosisHarian} mg/hari). Dosis telah di-cap ke batas aman.`
    );
  }

  // Peringatan jika dosis mendekati batas (>80% dari maks)
  if (!dosisDiCap && dosisHarian > obat.maksDosisHarian * 0.8) {
    statusKeamanan = "CAUTION";
    peringatanList.push(
      `⚠️ PERHATIAN: Dosis harian (${dosisHarian} mg) mendekati batas maksimum (${obat.maksDosisHarian} mg/hari). Monitor pasien dengan ketat.`
    );
  }

  // =====================================================
  // NODE 7: Return hasil kalkulasi
  // =====================================================
  return res.status(200).json({
    success: true,
    data: {
      obat: {
        nama: obat.nama,
        jenis: obat.jenis,
        maksDosisHarian: obat.maksDosisHarian,
      },
      pasien: {
        umur: umur,
        kategoriUmur: kategoriUmur,
        beratBadan: beratBadan,
        faktorUmur: faktorUmur,
      },
      kalkulasi: {
        metode: metodeKalkulasi,
        formulaDigunakan: formulaDigunakan,
        dosisPerPemberian: dosisPerPemberian,
        satuan: "mg",
        frekuensiHarian: frekuensiHarian,
        dosisHarian: dosisHarian,
        dosisDiCapKeMaksimum: dosisDiCap,
      },
      keamanan: {
        status: statusKeamanan,
        peringatan: peringatanList,
      },
    },
  });
}

module.exports = {
  hitungDosisObat,
};
