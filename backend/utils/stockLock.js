/**
 * =========================================================
 * STOCK LOCK - Mutex / Penguncian Stok (Race Condition Handling)
 * =========================================================
 * Modul ini mengimplementasikan mekanisme penguncian (mutex)
 * per obatId untuk mencegah race condition saat beberapa
 * request secara bersamaan mencoba mengurangi stok obat.
 *
 * FITUR UNTUK STRESS TESTING:
 * - Simulasi delay 2 detik pada proses pengurangan stok
 * - Request yang datang bersamaan akan ANTRE (queue)
 * - Saat stress test (ribuan request/detik), bottleneck
 *   akan terlihat jelas karena antrean ini
 * =========================================================
 */

// Map untuk menyimpan lock queue per obatId
// Key: obatId (string), Value: Promise chain
const lockMap = new Map();

// Counter untuk monitoring antrean (berguna saat stress test)
const queueCounter = new Map();

/**
 * acquireLock - Mengunci akses ke stok obat tertentu
 * 
 * Mengembalikan Promise yang resolve setelah lock diperoleh.
 * Jika obat sedang dikunci oleh proses lain, request akan
 * menunggu dalam antrean (FIFO).
 * 
 * @param {string} obatId - ID obat yang akan dikunci
 * @returns {Promise<Function>} - Fungsi release untuk melepas lock
 */
function acquireLock(obatId) {
  // Inisialisasi counter jika belum ada
  if (!queueCounter.has(obatId)) {
    queueCounter.set(obatId, 0);
  }

  // Tambah counter antrean
  const currentQueue = queueCounter.get(obatId) + 1;
  queueCounter.set(obatId, currentQueue);

  // Log untuk monitoring stress test
  if (currentQueue > 1) {
    console.log(
      `[STOCK-LOCK] Obat ${obatId}: ${currentQueue} request dalam antrean`
    );
  }

  let releaseFn;

  // Buat promise baru yang akan menjadi "giliran" request ini
  const newLock = new Promise((resolve) => {
    releaseFn = () => {
      // Kurangi counter saat lock dilepas
      const remaining = queueCounter.get(obatId) - 1;
      queueCounter.set(obatId, remaining);

      if (remaining > 0) {
        console.log(
          `[STOCK-LOCK] Obat ${obatId}: Lock dilepas, sisa antrean: ${remaining}`
        );
      }

      resolve();
    };
  });

  // Ambil lock yang sedang aktif (jika ada)
  const currentLock = lockMap.get(obatId) || Promise.resolve();

  // Set lock baru sebagai lock aktif
  lockMap.set(obatId, newLock);

  // Tunggu lock sebelumnya selesai, lalu berikan akses
  return currentLock.then(() => releaseFn);
}

/**
 * simulasiProsesStok - Simulasi delay proses pengurangan stok
 * 
 * Fungsi ini menambahkan delay buatan (2 detik) untuk
 * menyimulasikan proses database yang lambat.
 * 
 * TUJUAN: Saat stress testing, delay ini membuat setiap
 * request membutuhkan 2 detik, sehingga antrean cepat
 * menumpuk dan bottleneck terlihat jelas.
 * 
 * @param {string} obatId - ID obat
 * @param {number} jumlah - Jumlah yang dikurangi
 * @returns {Promise<void>}
 */
function simulasiProsesStok(obatId, jumlah) {
  return new Promise((resolve) => {
    console.log(
      `[STOCK-LOCK] Obat ${obatId}: Memproses pengurangan ${jumlah} unit (delay 2 detik)...`
    );

    // =============================================
    // DELAY BUATAN 2 DETIK
    // Untuk membuat bottleneck yang terukur
    // saat stress testing
    // =============================================
    setTimeout(() => {
      console.log(
        `[STOCK-LOCK] Obat ${obatId}: Pengurangan ${jumlah} unit selesai.`
      );
      resolve();
    }, 2000);
  });
}

/**
 * getQueueStatus - Mendapatkan status antrean semua obat
 * 
 * Berguna untuk monitoring saat stress testing.
 * 
 * @returns {Object} - Status antrean per obatId
 */
function getQueueStatus() {
  const status = {};
  queueCounter.forEach((count, obatId) => {
    if (count > 0) {
      status[obatId] = count;
    }
  });
  return status;
}

module.exports = {
  acquireLock,
  simulasiProsesStok,
  getQueueStatus,
};
