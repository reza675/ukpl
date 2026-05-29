function validateDosisInput(req, res, next) {
  const { namaObat, umur, beratBadan, jenisObat, rpiAlergi } = req.body;

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

  next();
}

module.exports = {
  validateDosisInput,
};
