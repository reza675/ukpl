import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const options = {
  stages: [
    { duration: "1m", target: 1000 }, // Naikkan ke 10000 user simultan (Load test)
    { duration: "2m", target: 3000 }, // Naikkan ke 15000 user (Stress test)
    { duration: "1m", target: 5000 }, // Genjot ke 20000 user (Mencari Break-point/titik hancur)
    { duration: "1m", target: 0 }, // Penurunan beban kembali ke 0 (Recovery)
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

//payload
const payloadDosis = JSON.stringify({
  "namaObat": "Ibuprofen",
  "umur": 1,
  "beratBadan": 7,
  "jenisObat": "bebas",
  "rpiAlergi": [
        "alergi_penisilin",
        "alergi_amoxicillin",
        "alergi_opioid",
        "asma_akut",
        "depresi_pernapasan",
        "asidosis_laktat",
        "alergi_opioid"
    ]
});

export default function () {
  const url = "http://localhost:5000/api/dosis/hitung";

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payloadDosis, params);

  check(res, {
    "status HTTP adalah 200": (r) => r.status === 200,

    "respons validasi sukses": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },

    "kecepatan respon < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(0.1);
}

export function handleSummary(data) {
  const standardSummary = textSummary(data, { indent: ' ', enableColors: true });

  const maxVUs = data.metrics.vus ? data.metrics.vus.values.max : 0;
  const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const reqsPerSec = data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : '0.00';
  const avgResponse = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : '0.00';
  const maxResponse = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max.toFixed(2) : '0.00';
  const errorCount = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.passes : 0;
  const errorRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : '0.00';

  const customDashboard = `
  ===================================================================
   🏥 HASIL AKHIR STRESS TESTING: FITUR KALKULATOR DOSIS APOTEK
  ===================================================================
   [Tanggal Tes]: ${new Date().toLocaleString('id-ID')}
   [Target URL]: http://localhost:5000/api/dosis/hitung
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
    'stdout': customDashboard,
    'hasil_stress_test.txt': customDashboard,
  };
}