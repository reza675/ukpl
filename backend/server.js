const express = require("express");
const cors = require("cors");

const dosisRoutes = require("./routes/dosisRoutes");
const { getQueueStatus } = require("./utils/stockLock");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/dosis", dosisRoutes);

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

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏥 Sistem Manajemen Apotek & Kalkulator Dosis Medis - API Server",
    version: "1.0.0",
    endpoints: {
      dosis: {
        hitung: "POST /api/dosis/hitung",
      },
      status: "GET /api/status",
    },
  });
});

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

app.listen(PORT, () => {
  console.log("=========================================================");
  console.log(" 🏥 SISTEM MANAJEMEN APOTEK & KALKULATOR DOSIS MEDIS");
  console.log("=========================================================");
  console.log(` ✅ Server berjalan di http://localhost:${PORT}`);
  console.log(` 📋 API Docs: http://localhost:${PORT}/`);
  console.log(` 📊 Status:   http://localhost:${PORT}/api/status`);
  console.log("=========================================================");
});
