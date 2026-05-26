/**
 * =========================================================
 * ROUTES: Kalkulator Dosis Obat
 * =========================================================
 * Routing terpisah dari controller agar mudah dibedah
 * untuk digambar Flow Graph dan Structure Chart.
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const { hitungDosisObat } = require("../controllers/dosisController");
const { validateDosisInput } = require("../middleware/validator");

/**
 * POST /api/dosis/hitung
 * 
 * Menghitung dosis obat berdasarkan parameter pasien.
 * Middleware validateDosisInput dijalankan terlebih dahulu
 * untuk validasi boundary value.
 * 
 * Body: {
 *   namaObat: string,
 *   umur: number (0-120),
 *   beratBadan: number (>0, max 300),
 *   jenisObat: "bebas" | "keras" | "psikotropika",
 *   rpiAlergi: string[]
 * }
 */
router.post("/hitung", validateDosisInput, hitungDosisObat);

module.exports = router;
