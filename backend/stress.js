const BASE_URL = "http://localhost:5000";

// Payload A
const payload = {
    namaObat: "Paracetamol",
    umur: 30,
    beratBadan: 65,
    jenisObat: "bebas",
    rpiAlergi: []
};

// Payload C
// const payload = {
//   namaObat: "Ibuprofen",
//   umur: 1,
//   beratBadan: 7,
//   jenisObat: "bebas",
//   rpiAlergi: ["alergi_penisilin","alergi_amoxicillin","alergi_opioid","asma_akut","depresi_pernapasan"]
// };

// Pengaturan untuk Tabel Dokumentasi
const jumlahRequest = 10000;
const labelPayload = "A (Ringan)"; // Ganti jadi B/C sesuai payload yang diuji

console.log(`🚀 Memulai Stress Test ${jumlahRequest} request bersamaan...`);
console.log(`Harap tunggu, sedang memproses...\n`);

async function runStressTest() {
    const requests = [];
    const startTime = Date.now();

    let successCount = 0;
    let failCount = 0;

    // Variabel untuk melacak waktu respons (Latency)
    let totalLatency = 0;
    let maxLatency = 0;

    for (let i = 0; i < jumlahRequest; i++) {
        const reqStartTime = Date.now(); // Waktu saat request dikirim

        const req = fetch(`${BASE_URL}/api/dosis/hitung`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                const reqEndTime = Date.now(); // Waktu saat response diterima
                const latency = reqEndTime - reqStartTime;

                // Catat latency
                totalLatency += latency;
                if (latency > maxLatency) maxLatency = latency;

                // Hapus komentar di bawah jika ingin membuang body response dari memory (menghindari memory leak)
                // await res.json(); 

                if (res.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            })
            .catch(err => {
                const reqEndTime = Date.now();
                const latency = reqEndTime - reqStartTime;

                totalLatency += latency;
                if (latency > maxLatency) maxLatency = latency;

                failCount++;
            });

        requests.push(req);
    }

    // Tunggu semua request selesai
    await Promise.all(requests);
    const endTime = Date.now();

    const totalTimeMs = endTime - startTime;
    const totalTimeSec = totalTimeMs / 1000;

    // 1. Throughput (Req/sec)
    const throughput = Math.round(jumlahRequest / totalTimeSec);

    // 2. Average Response Time
    const avgLatency = Math.round(totalLatency / jumlahRequest);

    // 3. Error Rate (%)
    const errorRate = ((failCount / jumlahRequest) * 100).toFixed(2);

    // 4. Status (✅ jika error 0%, ⚠️ jika ada error, ❌ jika error > 10%)
    let status = "✅";
    if (errorRate > 0 && errorRate < 10) status = "⚠️";
    if (errorRate >= 10) status = "❌";

    console.log("=================================================");
    console.log("🏁 HASIL STRESS TEST");
    console.log("=================================================");
    console.log(`Fase              : 1 (Bisa disesuaikan)`);
    console.log(`Payload           : ${labelPayload}`);
    console.log(`Total Requests    : ${jumlahRequest.toLocaleString()}`);
    console.log(`Req/sec (Speed)   : ${throughput.toLocaleString()}`);
    console.log(`Avg Time (ms)     : ${avgLatency} ms`);
    console.log(`Max Time (ms)     : ${maxLatency} ms`);
    console.log(`Error Count       : ${failCount.toLocaleString()}`);
    console.log(`Error Rate        : ${errorRate}%`);
    console.log(`Status            : ${status}`);
    console.log("=================================================");
    console.log(`⏱️ Waktu Eksekusi Script: ${totalTimeSec.toFixed(2)} detik`);
}

runStressTest();