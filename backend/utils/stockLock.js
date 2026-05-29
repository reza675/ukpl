const lockMap = new Map();

const queueCounter = new Map();
function acquireLock(obatId) {
  if (!queueCounter.has(obatId)) {
    queueCounter.set(obatId, 0);
  }

  const currentQueue = queueCounter.get(obatId) + 1;
  queueCounter.set(obatId, currentQueue);

  if (currentQueue > 1) {
    console.log(
      `[STOCK-LOCK] Obat ${obatId}: ${currentQueue} request dalam antrean`
    );
  }

  let releaseFn;

  const newLock = new Promise((resolve) => {
    releaseFn = () => {
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

  const currentLock = lockMap.get(obatId) || Promise.resolve();

  lockMap.set(obatId, newLock);

  return currentLock.then(() => releaseFn);
}
function simulasiProsesStok(obatId, jumlah) {
  return new Promise((resolve) => {
    console.log(
      `[STOCK-LOCK] Obat ${obatId}: Memproses pengurangan ${jumlah} unit (delay 2 detik)...`
    );

    setTimeout(() => {
      console.log(
        `[STOCK-LOCK] Obat ${obatId}: Pengurangan ${jumlah} unit selesai.`
      );
      resolve();
    }, 2000);
  });
}
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
