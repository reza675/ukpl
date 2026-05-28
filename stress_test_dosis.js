import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// =====================================================
// 1. KONFIGURASI BEBAN & TARGET KEGAGALAN
// =====================================================
export const options = {
  stages: [
    { duration: "1m", target: 1000 }, // Tahap 1: Naikkan ke 10000 user simultan (Load test)
    { duration: "2m", target: 3000 }, // Tahap 2: Naikkan ke 15000 user (Stress test)
    { duration: "1m", target: 5000 }, // Tahap 3: Genjot ke 20000 user (Mencari Break-point/titik hancur)
    { duration: "1m", target: 0 }, // Tahap 4: Penurunan beban kembali ke 0 (Recovery)
  ],
  thresholds: {
    // Jika kegagalan request/error rate di atas 5%, tes ditandai gagal (Breaked)
    http_req_failed: ["rate<0.05"],
    // Jika 95% request memiliki respon di atas 2000ms (2 detik), tandai gagal
    http_req_duration: ["p(95)<2000"],
  },
};

// =====================================================
// 2. DATA INPUT (Payload dicocokkan dengan Controller Anda)
// =====================================================
// Catatan: Pastikan namaObat di bawah ini ada di dalam mockDatabase Anda.
// Kita menggunakan skenario pasien Dewasa dengan Jenis Obat Bebas/Keras yang valid.
const payloadDosis = JSON.stringify({
  namaObat: "Ibuprofen", // <-- Sesuaikan dengan salah satu nama obat di mockDatabase.js Anda
  umur: 1, // Kategori dewasa (Node 2 pada controller)
  beratBadan: 7, // Berat badan valid (>0)
  jenisObat: "bebas", // Harus sinkron dengan properti obat di DB Anda
  rpiAlergi: [
    "alergi_penisilin",
    "alergi_amoxicillin",
    "alergi_opioid",
    "asma_akut",
    "depresi_pernapasan",
    "asidosis_laktat",
    "alergi_opioid"
  ], // Kosongkan agar tidak memicu deteksi kontraindikasi (Error 403)
});

export default function () {
  // URL disesuaikan dengan PORT 5000 Express dan route path di server.js Anda
  const url = "http://localhost:5000/api/dosis/hitung";

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Eksekusi request POST ke API hitung dosis
  const res = http.post(url, payloadDosis, params);

  // =====================================================
  // 3. VALIDASI RESPONS SESUAI FORMAT BACKEND ANDA
  // =====================================================
  check(res, {
    // Memastikan server mengembalikan status HTTP 200 OK
    "status HTTP adalah 200": (r) => r.status === 200,

    // Memastikan properti JSON respons berisi "success: true" sesuai struktur controller
    "respons validasi sukses": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false; // Gagal jika response bukan JSON atau server crash (HTML Error)
      }
    },

    // Kecepatan respon murni per user di bawah 200ms
    "kecepatan respon < 200ms": (r) => r.timings.duration < 200,
  });

  // Jeda kecil 100ms antar iterasi user agar load meningkat secara konstan dan halus
  sleep(0.1);
}

// =====================================================
// 4. KUSTOMISASI HASIL AKHIR (handleSummary)
// =====================================================
export function handleSummary(data) {
  // Mengambil summary bawaan k6
  const standardSummary = textSummary(data, { indent: ' ', enableColors: true });

  // Ekstraksi nilai variabel dari data metrics k6 secara dinamis
  const maxVUs = data.metrics.vus ? data.metrics.vus.values.max : 0;
  const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const reqsPerSec = data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : '0.00';
  const avgResponse = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : '0.00';
  const maxResponse = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max.toFixed(2) : '0.00';
  const errorCount = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.passes : 0;
  const errorRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : '0.00';

  // Membuat dekorasi teks kustom tambahan beserta tabel indikator fase
  const customDashboard = `
  ===================================================================
   🏥 HASIL AKHIR STRESS TESTING: FITUR KALKULATOR DOSIS APOTEK
  ===================================================================
   [Tanggal Tes]: ${new Date().toLocaleString('id-ID')}
   [Target URL]: http://localhost:5000/api/dosis/hitung
   [Status Pengujian]: Selesai Menggempur Server!
  ===================================================================
  
  █ RINGKASAN ANALISIS MANDIRI:
  1. Beban Maksimum VUs : ${maxVUs} Users
  2. Total Request Sukses: ${totalReqs} requests
  3. Rasio Kegagalan     : ${errorRate}%
  4. Kecepatan p(95)     : ${(data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0).toFixed(2)} ms
  
  -------------------------------------------------------------------
  █ TABEL BREAKDOWN INDIKATOR FASE:
  -------------------------------------------------------------------
  +------+------+---------+----------------+---------------+-----------------------+-----------------------+-------------+----------------+
  | Fase | VU   | Payload | Total Requests | Requests/ sec | Avg Response Time(ms) | Max Response Time(ms) | Error Count | Error Rate (%) |
  +------+------+---------+----------------+---------------+-----------------------+-----------------------+-------------+----------------+
  | Puncak| ${maxVUs.toString().padEnd(4)} | JSON    | ${totalReqs.toString().padEnd(14)} | ${reqsPerSec.padEnd(13)} | ${avgResponse.padEnd(21)} | ${maxResponse.padEnd(21)} | ${errorCount.toString().padEnd(11)} | ${errorRate.padEnd(14)} |
  +------+------+---------+----------------+---------------+-----------------------+-----------------------+-------------+----------------+
  
  -------------------------------------------------------------------
  █ DETAIL METRIK BAWAAN GRAFANA K6:
  -------------------------------------------------------------------
  ${standardSummary}
  ===================================================================
  `;

  return {
    'stdout': customDashboard, // Menampilkan laporan lengkap ini langsung di Terminal saat tes selesai
    'hasil_stress_test.txt': customDashboard, // Otomatis menyimpan berkas log teks di folder Anda
  };
}