const { obatList } = require("../data/mockDatabase");

function hitungDosisObat(req, res) {
  const { namaObat, umur, beratBadan, jenisObat, rpiAlergi = [] } = req.body;

  const obat = obatList.find(
    (o) => o.nama.toLowerCase() === namaObat.toLowerCase()
  );

  if (!obat) {
    return res.status(404).json({
      success: false,
      error: {
        code: "OBAT_NOT_FOUND",
        message: `Obat "${namaObat}" tidak ditemukan dalam database.`,
        field: "namaObat",
      },
    });
  }

  if (obat.jenis !== jenisObat) {
    return res.status(400).json({
      success: false,
      error: {
        code: "JENIS_MISMATCH",
        message: `Jenis obat tidak cocok. ${obat.nama} terdaftar sebagai "${obat.jenis}", bukan "${jenisObat}".`,
        field: "jenisObat",
      },
    });
  }

  let kategoriUmur = "";
  let faktorUmur = 1.0;
  let peringatanList = [];

  if (umur >= 0 && umur <= 1) {
    kategoriUmur = "bayi";
    faktorUmur = 0.2;
    peringatanList.push(
      "⚠️ PERHATIAN: Pasien kategori BAYI. Dosis dihitung berbasis mg/kgBB langsung (untuk obat berdasarkan BB) atau Rumus Fried (untuk obat dosis tetap)."
    );

    if (jenisObat === "keras") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL",
          severity: "CRITICAL",
          message: `Obat "${obat.nama}" berjenis KERAS tidak boleh diberikan kepada BAYI (umur ${umur} tahun). Konsultasikan dengan dokter spesialis anak.`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    } else if (jenisObat === "psikotropika") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL",
          severity: "CRITICAL",
          message: `Obat "${obat.nama}" berjenis PSIKOTROPIKA dilarang keras untuk BAYI. Dapat menyebabkan depresi sistem saraf pusat yang fatal.`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    }

  } else if (umur >= 2 && umur <= 12) {
    kategoriUmur = "anak";
    faktorUmur = 0.5;
    peringatanList.push(
      "ℹ️ Pasien kategori ANAK. Dosis dihitung berbasis mg/kgBB langsung (pediatri) atau Rumus Young (untuk obat dosis tetap)."
    );

    if (jenisObat === "psikotropika") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL",
          severity: "CRITICAL",
          message: `Obat "${obat.nama}" berjenis PSIKOTROPIKA tidak boleh diberikan kepada ANAK di bawah 18 tahun (umur ${umur} tahun).`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    }

    if (jenisObat === "keras") {
      peringatanList.push(
        `⚠️ PERHATIAN: Obat keras "${obat.nama}" untuk anak.  `
      );
    }

  } else if (umur >= 13 && umur <= 17) {
    kategoriUmur = "remaja";
    faktorUmur = 0.75;
    peringatanList.push(
      "ℹ️ Pasien kategori REMAJA. Dosis dihitung berbasis mg/kgBB (di-cap ke dosis dewasa standar) atau Rumus Young."
    );

    if (jenisObat === "psikotropika") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FATAL",
          severity: "CRITICAL",
          message: `Obat "${obat.nama}" berjenis PSIKOTROPIKA tidak boleh diberikan kepada pasien di bawah 18 tahun (umur ${umur} tahun).`,
          field: "jenisObat",
          kategoriPasien: kategoriUmur,
        },
      });
    }

  } else if (umur >= 18 && umur <= 59) {
    kategoriUmur = "dewasa";
    faktorUmur = 1.0;

  } else if (umur >= 60 && umur <= 120) {
    kategoriUmur = "lansia";
    faktorUmur = 0.8;
    peringatanList.push(
      "⚠️ PERHATIAN: Pasien kategori LANSIA. Dosis diturunkan 20% (faktor 0.8) untuk kompensasi penurunan fungsi hati/ginjal."
    );

    if (jenisObat === "keras") {
      peringatanList.push(
        `⚠️ Obat keras "${obat.nama}" untuk lansia memerlukan monitoring fungsi organ (hati & ginjal).`
      );
    }

    if (jenisObat === "psikotropika") {
      peringatanList.push(
        `⚠️ PERHATIAN TINGGI: Psikotropika "${obat.nama}" untuk lansia berisiko tinggi jatuh dan sedasi berlebihan. Dosis dimulai dari dosis terkecil.`
      );
      faktorUmur = 0.5;
    }
  }

  if (rpiAlergi.length > 0 && obat.kontraindikasi.length > 0) {
    const alergiCocok = [];

    for (let i = 0; i < rpiAlergi.length; i++) {
      const alergiPasien = rpiAlergi[i].toLowerCase();

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

    if (alergiCocok.length > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ALERGI_KONTRAINDIKASI",
          severity: "CRITICAL",
          message: `Pasien memiliki riwayat alergi/kondisi yang merupakan KONTRAINDIKASI obat "${obat.nama}". Pemberian obat ini dapat menyebabkan reaksi anafilaksis yang mengancam nyawa.`,
          detail: alergiCocok,
          field: "rpiAlergi",
        },
      });
    }
  }

  let dosisPerPemberian;
  let metodeKalkulasi;
  let formulaDigunakan;

  if (obat.dosisPerKg > 0) {
    const dosisDasar = beratBadan * obat.dosisPerKg;

    if (kategoriUmur === "bayi") {
      dosisPerPemberian = dosisDasar;
      metodeKalkulasi = "mg_per_kgBB_pediatri";
      formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;
      peringatanList.push(
        `ℹ️ Dosis bayi: BB (${beratBadan} kg) × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg. Batas maks harian dipantau ketat.`
      );

    } else if (kategoriUmur === "anak") {
      dosisPerPemberian = dosisDasar;
      metodeKalkulasi = "mg_per_kgBB_pediatri";
      formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;

    } else if (kategoriUmur === "remaja") {
      const dosisDewasaRef = 70 * obat.dosisPerKg;

      if (dosisDasar > dosisDewasaRef) {
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
      dosisPerPemberian = dosisDasar;
      metodeKalkulasi = "mg_per_kgBB_dewasa";
      formulaDigunakan = `${beratBadan} kg × ${obat.dosisPerKg} mg/kg = ${dosisDasar} mg`;

    } else if (kategoriUmur === "lansia") {
      const dosisGeriatri = dosisDasar * 0.8;
      dosisPerPemberian = dosisGeriatri;
      metodeKalkulasi = "mg_per_kgBB_geriatri";
      formulaDigunakan = `(${beratBadan} kg × ${obat.dosisPerKg} mg/kg) × 0.8 = ${dosisGeriatri} mg (koreksi fungsi organ lansia)`;
      peringatanList.push(
        `⚠️ Dosis lansia dikurangi 20%: ${dosisDasar} mg × 0.8 = ${dosisGeriatri} mg (kompensasi penurunan fungsi hati/ginjal).`
      );

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
    const dosisDewasa = obat.dosisTetap;

    if (kategoriUmur === "bayi") {
      const umurBulan = Math.max(umur * 12, 1);
      dosisPerPemberian = (umurBulan / 150) * dosisDewasa;
      metodeKalkulasi = "rumus_fried";
      formulaDigunakan = `Rumus Fried: (${umurBulan} bulan / 150) × ${dosisDewasa} mg = ${((umurBulan / 150) * dosisDewasa).toFixed(2)} mg`;
      peringatanList.push(
        `ℹ️ Dosis bayi dihitung dengan Rumus Fried (umur ${umurBulan} bulan).`
      );

    } else if (kategoriUmur === "anak" || kategoriUmur === "remaja") {
      dosisPerPemberian = (umur / (umur + 12)) * dosisDewasa;
      metodeKalkulasi = "rumus_young";
      formulaDigunakan = `Rumus Young: (${umur} / (${umur} + 12)) × ${dosisDewasa} mg = ${((umur / (umur + 12)) * dosisDewasa).toFixed(2)} mg`;
      peringatanList.push(
        `ℹ️ Dosis ${kategoriUmur} dihitung dengan Rumus Young (umur ${umur} tahun).`
      );

    } else if (kategoriUmur === "dewasa") {
      dosisPerPemberian = dosisDewasa;
      metodeKalkulasi = "dosis_tetap_dewasa";
      formulaDigunakan = `Dosis tetap dewasa: ${dosisDewasa} mg`;

    } else if (kategoriUmur === "lansia") {
      const dosisGeriatri = dosisDewasa * 0.8;
      dosisPerPemberian = dosisGeriatri;
      metodeKalkulasi = "dosis_tetap_geriatri";
      formulaDigunakan = `Dosis geriatri: ${dosisDewasa} mg × 0.8 = ${dosisGeriatri} mg`;
      peringatanList.push(
        `⚠️ Dosis lansia dikurangi 20%: ${dosisDewasa} mg × 0.8 = ${dosisGeriatri} mg.`
      );
    }

  } else {
    return res.status(500).json({
      success: false,
      error: {
        code: "DATA_ERROR",
        message: `Data dosis untuk obat "${obat.nama}" tidak valid di database.`,
        field: "namaObat",
      },
    });
  }

  dosisPerPemberian = Math.round(dosisPerPemberian * 100) / 100;

  const frekuensiHarian = 3;
  let dosisHarian = dosisPerPemberian * frekuensiHarian;
  dosisHarian = Math.round(dosisHarian * 100) / 100;

  let statusKeamanan = "AMAN";
  let dosisDiCap = false;

  if (dosisHarian > obat.maksDosisHarian) {
    const dosisHarianSebelumCap = dosisHarian;
    dosisHarian = obat.maksDosisHarian;
    dosisPerPemberian = Math.round((dosisHarian / frekuensiHarian) * 100) / 100;
    dosisDiCap = true;
    statusKeamanan = "WARNING";

    peringatanList.push(
      `⚠️ PERINGATAN DOSIS: Kalkulasi dosis harian (${dosisHarianSebelumCap} mg) MELEBIHI batas maksimum (${obat.maksDosisHarian} mg/hari). Dosis telah di-cap ke batas aman.`
    );
  }

  if (!dosisDiCap && dosisHarian > obat.maksDosisHarian * 0.8) {
    statusKeamanan = "CAUTION";
    peringatanList.push(
      `⚠️ PERHATIAN: Dosis harian (${dosisHarian} mg) mendekati batas maksimum (${obat.maksDosisHarian} mg/hari). Monitor pasien dengan ketat.`
    );
  }

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
