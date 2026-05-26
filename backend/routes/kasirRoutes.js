/**
 * =========================================================
 * ROUTES: Kasir / Point of Sale (POS)
 * =========================================================
 * Routing terpisah dari controller agar mudah dibedah
 * untuk digambar Flow Graph dan Structure Chart.
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const {
  prosesTransaksiKasir,
  getObatList,
  getMemberList,
} = require("../controllers/kasirController");
const { validateKasirInput } = require("../middleware/validator");

/**
 * GET /api/kasir/obat
 * 
 * Mengambil daftar semua obat (untuk dropdown di frontend).
 * Tidak memerlukan validasi khusus.
 */
router.get("/obat", getObatList);

/**
 * GET /api/kasir/member
 * 
 * Mengambil daftar semua member apotek.
 * Tidak memerlukan validasi khusus.
 */
router.get("/member", getMemberList);

/**
 * POST /api/kasir/proses
 * 
 * Memproses transaksi kasir.
 * Middleware validateKasirInput dijalankan terlebih dahulu.
 * 
 * Body: {
 *   keranjang: [{ obatId: string, jumlah: number }],
 *   memberId: string | null,
 *   metodePembayaran: "tunai" | "asuransi" | "bpjs",
 *   nominalBayar: number
 * }
 */
router.post("/proses", validateKasirInput, prosesTransaksiKasir);

module.exports = router;
