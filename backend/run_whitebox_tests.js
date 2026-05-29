const BASE_URL = "http://localhost:5000/api/dosis/hitung";

const testCases = [
  {
    id: "TC01",
    path: "P1",
    name: "Obat tidak ada di database",
    payload: { namaObat: "ObatTidakAda", umur: 25, beratBadan: 70, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 404
  },
  {
    id: "TC02",
    path: "P2",
    name: "Jenis obat mismatch (Paracetamol bukan keras)",
    payload: { namaObat: "Paracetamol", umur: 25, beratBadan: 70, jenisObat: "keras", rpiAlergi: [] },
    expectedStatus: 400
  },

  {
    id: "TC03",
    path: "P3",
    name: "Bayi + Obat Keras (Amoxicillin) -> FATAL",
    payload: { namaObat: "Amoxicillin", umur: 1, beratBadan: 8, jenisObat: "keras", rpiAlergi: [] },
    expectedStatus: 403
  },
  {
    id: "TC04",
    path: "P4",
    name: "Bayi + Psikotropika (Codein) -> FATAL",
    payload: { namaObat: "Codein", umur: 0, beratBadan: 3.5, jenisObat: "psikotropika", rpiAlergi: [] },
    expectedStatus: 403
  },
  {
    id: "TC05",
    path: "P5",
    name: "Bayi + Obat Bebas (Paracetamol) -> AMAN",
    payload: { namaObat: "Paracetamol", umur: 1, beratBadan: 9, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },

  {
    id: "TC06",
    path: "P6",
    name: "Anak + Psikotropika (Codein) -> FATAL",
    payload: { namaObat: "Codein", umur: 2, beratBadan: 12, jenisObat: "psikotropika", rpiAlergi: [] },
    expectedStatus: 403
  },
  {
    id: "TC07",
    path: "P7",
    name: "Anak + Obat Keras (Amoxicillin) -> AMAN",
    payload: { namaObat: "Amoxicillin", umur: 12, beratBadan: 40, jenisObat: "keras", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC08",
    path: "P8",
    name: "Anak + Obat Bebas (Paracetamol) -> AMAN",
    payload: { namaObat: "Paracetamol", umur: 6, beratBadan: 20, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },

  {
    id: "TC09",
    path: "P9",
    name: "Remaja + Psikotropika (Diazepam) -> FATAL",
    payload: { namaObat: "Diazepam", umur: 13, beratBadan: 45, jenisObat: "psikotropika", rpiAlergi: [] },
    expectedStatus: 403
  },
  {
    id: "TC10",
    path: "P10",
    name: "Remaja + Dosis Cap (80kg -> turun ke 70kg dosis max)",
    payload: { namaObat: "Paracetamol", umur: 17, beratBadan: 80, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC11",
    path: "P11",
    name: "Remaja + Dosis Normal (50kg -> tidak di-cap)",
    payload: { namaObat: "Paracetamol", umur: 15, beratBadan: 50, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },

  {
    id: "TC12",
    path: "P12",
    name: "Dewasa + Obat Bebas -> AMAN",
    payload: { namaObat: "Paracetamol", umur: 18, beratBadan: 70, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },

  {
    id: "TC13",
    path: "P13",
    name: "Lansia + Obat Keras (Amoxicillin) -> AMAN",
    payload: { namaObat: "Amoxicillin", umur: 60, beratBadan: 65, jenisObat: "keras", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC14",
    path: "P14",
    name: "Lansia + Psikotropika (Codein) -> AMAN (Dosis diturunkan 50%)",
    payload: { namaObat: "Codein", umur: 65, beratBadan: 60, jenisObat: "psikotropika", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC15",
    path: "P15",
    name: "Lansia + Obat Bebas -> AMAN",
    payload: { namaObat: "Paracetamol", umur: 120, beratBadan: 55, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },

  {
    id: "TC16",
    path: "P16",
    name: "Umur diluar range valid (-1 tahun) -> Diteruskan fallback",
    payload: { namaObat: "Paracetamol", umur: -1, beratBadan: 70, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 400
  },

  {
    id: "TC17",
    path: "P17",
    name: "Alergi COCOK (alergi_paracetamol) -> TOLAK",
    payload: { namaObat: "Paracetamol", umur: 30, beratBadan: 70, jenisObat: "bebas", rpiAlergi: ["alergi_paracetamol"] },
    expectedStatus: 403
  },
  {
    id: "TC18",
    path: "P18",
    name: "Alergi TIDAK COCOK (alergi_penisilin) -> LANJUT",
    payload: { namaObat: "Paracetamol", umur: 30, beratBadan: 70, jenisObat: "bebas", rpiAlergi: ["alergi_penisilin"] },
    expectedStatus: 200
  },

  {
    id: "TC19",
    path: "P19",
    name: "Bayi + Dosis Tetap -> Rumus Fried (Bulan)",
    payload: { namaObat: "Antasida DOEN", umur: 1, beratBadan: 8, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC20",
    path: "P20",
    name: "Anak/Remaja + Dosis Tetap -> Rumus Young",
    payload: { namaObat: "Antasida DOEN", umur: 8, beratBadan: 25, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC21",
    path: "P21",
    name: "Dewasa + Dosis Tetap -> Normal",
    payload: { namaObat: "Antasida DOEN", umur: 30, beratBadan: 70, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC22",
    path: "P22",
    name: "Lansia + Dosis Tetap -> Turun 20%",
    payload: { namaObat: "Antasida DOEN", umur: 70, beratBadan: 60, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },

  {
    id: "TC23",
    path: "P23",
    name: "Data Error (Tidak ada dosisPerKg & dosisTetap) -> DATA_ERROR",
    payload: { namaObat: "ObatDummyTanpaDosis", umur: 25, beratBadan: 70, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 500
  },

  {
    id: "TC24",
    path: "P24",
    name: "Batas Maks (Boundary) -> Dosis harian > max (di-cap) -> WARNING",
    payload: { namaObat: "Cetirizine", umur: 59, beratBadan: 70, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  },
  {
    id: "TC25",
    path: "P25",
    name: "Batas CAUTION -> Dosis harian > 80% dari max",
    payload: { namaObat: "Vitamin C", umur: 50, beratBadan: 120, jenisObat: "bebas", rpiAlergi: [] },
    expectedStatus: 200
  }
];

async function runTests() {
  console.log("===============================================================");
  console.log(" 🧪 EXECUTING 25 INDEPENDENT PATHS TESTING (SQA - V(G)=25)");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;
  let serverDown = false;

  for (const test of testCases) {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(test.payload)
      });

      const actualStatus = response.status;
      
      let responseBody = {};
      try {
        responseBody = await response.json();
      } catch (e) { }

      if (actualStatus === test.expectedStatus) {
        console.log(`✅ [${test.id} - ${test.path}] PASSED | ${test.name}`);
        passed++;
      } else {
        console.log(`❌ [${test.id} - ${test.path}] FAILED | ${test.name}`);
        console.log(`   Expected HTTP ${test.expectedStatus}, Got ${actualStatus}`);
        console.log(`   Response:`, responseBody);
        failed++;
      }

    } catch (error) {
      console.log(`🚨 [${test.id} - ${test.path}] SERVER ERROR / NETWORK FAIL: ${error.message}`);
      failed++;
      if (error.code === 'ECONNREFUSED') {
          serverDown = true;
          console.log(`\n❌ UJIAN DIBATALKAN. SERVER LOKAL (${BASE_URL}) TIDAK MENYALA.`);
          break;
      }
    }
  }

  if(!serverDown) {
      console.log("\n===============================================================");
      console.log(` 📊 SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${testCases.length})`);
      
      const coverage = (passed / testCases.length) * 100;
      console.log(` 🎯 PATH COVERAGE SCORE: ${coverage.toFixed(2)}%`);
      
      if (passed === testCases.length) {
        console.log(" 🏆 PERFECT! SELURUH 25 PATH BERHASIL DIEKSEKUSI SESUAI SQA!");
      } else {
        console.log(" ⚠️ TERDAPAT DEFECT/MISSING LOGIC PADA KODE CONTROLLER.");
      }
      console.log("===============================================================\n");
  }
}

runTests();
