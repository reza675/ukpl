const BASE_URL = "http://localhost:5000";

// Payload Kalkulator Dosis
const payload = {
  namaObat: "Paracetamol",
  umur: 10,
  beratBadan: 30,
  jenisObat: "bebas",
  rpiAlergi: []
};

const jumlahRequest = 20000; 

console.log(` Memulai Stress Test ${jumlahRequest} request bersamaan...`);

async function runStressTest() {
  const requests = [];
  const startTime = Date.now();
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < jumlahRequest; i++) {
    const req = fetch(`${BASE_URL}/api/dosis/hitung`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
        console.log(`❌ Req ${i+1} Gagal: ${data.error ? data.error.message : 'Unknown Error'}`);
      }
    })
    .catch(err => {
      failCount++;
      console.log(`❌ Req ${i+1} Gagal (Network): ${err.message}`);
    });
      
    requests.push(req);
  }

  // Tunggu semua selesai
  await Promise.all(requests);
  const endTime = Date.now();
  
  console.log("===========================================");
  console.log("🏁 Stress Test Dosis Selesai!");
  console.log(`✅ Berhasil : ${successCount} requests`);
  console.log(`❌ Gagal    : ${failCount} requests`);
  console.log(`⏱️ Waktu Total: ${endTime - startTime} ms`);
  console.log("===========================================");
}

runStressTest();
