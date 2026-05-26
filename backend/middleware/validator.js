/**
 * =========================================================
 * VALIDATOR MIDDLEWARE - Validasi Input & Boundary Value
 * =========================================================
 * Middleware ini memvalidasi input dari request sebelum
 * masuk ke controller. Dirancang untuk memenuhi kriteria
 * BLACKBOX TESTING (Boundary Value Analysis).
 *
 * Semua error dikembalikan sebagai JSON terstruktur:
 * {
 *   success: false,
 *   error: {
 *     code: "VALIDATION_ERROR",
 *     message: "...",
 *     field: "namaField"
 *   }
 * }
 * =========================================================
 */

/**
 * validateDosisInput - Validasi input untuk kalkulator dosis
 *
 * Boundary Values yang divalidasi:
 * - umur: min 0, max 120 (tolak < 0 atau > 120)
 * - beratBadan: min > 0, max 300 (tolak <= 0 atau > 300)
 * - namaObat: wajib diisi (string non-empty)
 * - jenisObat: harus salah satu dari [bebas, keras, psikotropika]
 * - rpiAlergi: harus array (boleh kosong)
 */
function validateDosisInput(req, res, next) {
  const { namaObat, umur, beratBadan, jenisObat, rpiAlergi } = req.body;

  // ------ Validasi namaObat ------
  if (!namaObat || typeof namaObat !== "string" || namaObat.trim() === "") {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Nama obat wajib diisi dan harus berupa teks.",
        field: "namaObat",
      },
    });
  }

  // ------ Validasi umur (Boundary: 0 - 120) ------
  if (umur === undefined || umur === null || typeof umur !== "number") {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Umur wajib diisi dan harus berupa angka.",
        field: "umur",
      },
    });
  }

  if (umur < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BOUNDARY_ERROR",
        message: "Umur tidak boleh kurang dari 0 tahun. Nilai yang diberikan: " + umur,
        field: "umur",
        boundary: { min: 0, max: 120, received: umur },
      },
    });
  }

  if (umur > 120) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BOUNDARY_ERROR",
        message: "Umur tidak boleh lebih dari 120 tahun. Nilai yang diberikan: " + umur,
        field: "umur",
        boundary: { min: 0, max: 120, received: umur },
      },
    });
  }

  // ------ Validasi beratBadan (Boundary: > 0, max 300) ------
  if (
    beratBadan === undefined ||
    beratBadan === null ||
    typeof beratBadan !== "number"
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Berat badan wajib diisi dan harus berupa angka.",
        field: "beratBadan",
      },
    });
  }

  if (beratBadan <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BOUNDARY_ERROR",
        message:
          "Berat badan harus lebih dari 0 kg. Nilai yang diberikan: " +
          beratBadan,
        field: "beratBadan",
        boundary: { min: 0.1, max: 300, received: beratBadan },
      },
    });
  }

  if (beratBadan > 300) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BOUNDARY_ERROR",
        message:
          "Berat badan tidak boleh lebih dari 300 kg. Nilai yang diberikan: " +
          beratBadan,
        field: "beratBadan",
        boundary: { min: 0.1, max: 300, received: beratBadan },
      },
    });
  }

  // ------ Validasi jenisObat ------
  const jenisValid = ["bebas", "keras", "psikotropika"];
  if (!jenisObat || !jenisValid.includes(jenisObat)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          'Jenis obat harus salah satu dari: "bebas", "keras", "psikotropika".',
        field: "jenisObat",
        validValues: jenisValid,
      },
    });
  }

  // ------ Validasi rpiAlergi ------
  if (rpiAlergi !== undefined && !Array.isArray(rpiAlergi)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Riwayat alergi harus berupa array (boleh kosong).",
        field: "rpiAlergi",
      },
    });
  }

  // Semua validasi lolos, lanjut ke controller
  next();
}

/**
 * validateKasirInput - Validasi input untuk kasir/POS
 *
 * Boundary Values yang divalidasi:
 * - keranjang: wajib array non-empty
 * - keranjang[].obatId: wajib diisi
 * - keranjang[].jumlah: harus > 0
 * - metodePembayaran: harus salah satu dari [tunai, asuransi, bpjs]
 * - nominalBayar: jika tunai, harus >= 0
 */
function validateKasirInput(req, res, next) {
  const { keranjang, metodePembayaran, nominalBayar } = req.body;

  // ------ Validasi keranjang ------
  if (!keranjang || !Array.isArray(keranjang)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Keranjang belanja wajib diisi dan harus berupa array.",
        field: "keranjang",
      },
    });
  }

  if (keranjang.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BOUNDARY_ERROR",
        message: "Keranjang belanja tidak boleh kosong.",
        field: "keranjang",
      },
    });
  }

  // ------ Validasi setiap item dalam keranjang ------
  for (let i = 0; i < keranjang.length; i++) {
    const item = keranjang[i];

    if (!item.obatId || typeof item.obatId !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Item keranjang ke-${i + 1}: obatId wajib diisi.`,
          field: `keranjang[${i}].obatId`,
        },
      });
    }

    if (
      item.jumlah === undefined ||
      item.jumlah === null ||
      typeof item.jumlah !== "number"
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Item keranjang ke-${i + 1}: jumlah wajib diisi dan harus angka.`,
          field: `keranjang[${i}].jumlah`,
        },
      });
    }

    if (item.jumlah <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BOUNDARY_ERROR",
          message: `Item keranjang ke-${i + 1}: jumlah beli harus lebih dari 0. Nilai: ${item.jumlah}`,
          field: `keranjang[${i}].jumlah`,
          boundary: { min: 1, received: item.jumlah },
        },
      });
    }

    if (!Number.isInteger(item.jumlah)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Item keranjang ke-${i + 1}: jumlah harus bilangan bulat.`,
          field: `keranjang[${i}].jumlah`,
        },
      });
    }
  }

  // ------ Validasi metodePembayaran ------
  const metodeValid = ["tunai", "asuransi", "bpjs"];
  if (!metodePembayaran || !metodeValid.includes(metodePembayaran)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          'Metode pembayaran harus salah satu dari: "tunai", "asuransi", "bpjs".',
        field: "metodePembayaran",
        validValues: metodeValid,
      },
    });
  }

  // ------ Validasi nominalBayar (jika tunai) ------
  if (metodePembayaran === "tunai") {
    if (
      nominalBayar === undefined ||
      nominalBayar === null ||
      typeof nominalBayar !== "number"
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Nominal bayar wajib diisi (angka) untuk pembayaran tunai.",
          field: "nominalBayar",
        },
      });
    }

    if (nominalBayar < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BOUNDARY_ERROR",
          message:
            "Nominal bayar tidak boleh negatif. Nilai: " + nominalBayar,
          field: "nominalBayar",
          boundary: { min: 0, received: nominalBayar },
        },
      });
    }
  }

  // Semua validasi lolos
  next();
}

module.exports = {
  validateDosisInput,
  validateKasirInput,
};
