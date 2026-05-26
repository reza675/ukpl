/**
 * =========================================================
 * SERVER.JS - Entry Point Backend Express
 * =========================================================
 * Sistem Manajemen Apotek & Kalkulator Dosis Medis
 * 
 * Struktur:
 * - server.js (ini) → mounting routes
 * - routes/ → routing endpoint
 * - controllers/ → logika bisnis
 * - middleware/ → validasi input
 * - data/ → mock database
 * - utils/ → utilitas (lock, dll)
 * =========================================================
 */

const express = require("express");
const cors = require("cors");

// Import routes
const dosisRoutes = require("./routes/dosisRoutes");
const kasirRoutes = require("./routes/kasirRoutes");

// Import utilitas untuk monitoring
const { getQueueStatus } = require("./utils/stockLock");

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE GLOBAL
// =====================================================

// CORS - izinkan frontend React (default port 5173 Vite)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Parse JSON body
app.use(express.json());

// Logger sederhana untuk monitoring request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// =====================================================
// MOUNT ROUTES
// =====================================================
app.use("/api/dosis", dosisRoutes);
app.use("/api/kasir", kasirRoutes);

// =====================================================
// ENDPOINT MONITORING (untuk Stress Testing)
// =====================================================

/**
 * GET /api/status
 * 
 * Menampilkan status server dan antrean lock.
 * Berguna untuk monitoring saat stress testing.
 */
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    data: {
      server: "running",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      queueStatus: getQueueStatus(),
    },
  });
});

/**
 * GET /
 * 
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏥 Sistem Manajemen Apotek & Kalkulator Dosis Medis - API Server",
    version: "1.0.0",
    endpoints: {
      dosis: {
        hitung: "POST /api/dosis/hitung",
      },
      kasir: {
        obat: "GET /api/kasir/obat",
        member: "GET /api/kasir/member",
        proses: "POST /api/kasir/proses",
      },
      status: "GET /api/status",
    },
  });
});

// =====================================================
// ERROR HANDLING GLOBAL
// =====================================================
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan internal pada server.",
    },
  });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log("=========================================================");
  console.log(" 🏥 SISTEM MANAJEMEN APOTEK & KALKULATOR DOSIS MEDIS");
  console.log("=========================================================");
  console.log(` ✅ Server berjalan di http://localhost:${PORT}`);
  console.log(` 📋 API Docs: http://localhost:${PORT}/`);
  console.log(` 📊 Status:   http://localhost:${PORT}/api/status`);
  console.log("=========================================================");
});
