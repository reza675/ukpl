/**
 * =========================================================
 * MOCK DATABASE - Simulasi Data Apotek
 * =========================================================
 * File ini berisi array dummy yang berfungsi sebagai
 * pengganti database asli untuk keperluan pengujian SQA.
 * =========================================================
 */

// =====================================================
// DAFTAR OBAT (Mock Table: obat)
// =====================================================
const obatList = [
  {
    id: "OBT001",
    nama: "Paracetamol",
    jenis: "bebas",          // bebas | keras | psikotropika
    stok: 150,
    harga: 5000,             // Rupiah per tablet/strip
    dosisPerKg: 15,          // mg per kg berat badan
    maksDosisHarian: 4000,   // mg per hari (maks)
    kontraindikasi: ["alergi_paracetamol", "gangguan_hati_berat"],
    dicover_asuransi: true,
    dicover_bpjs: true,
  },
  {
    id: "OBT002",
    nama: "Amoxicillin",
    jenis: "keras",
    stok: 80,
    harga: 12000,
    dosisPerKg: 25,
    maksDosisHarian: 3000,
    kontraindikasi: ["alergi_penisilin", "alergi_amoxicillin"],
    dicover_asuransi: true,
    dicover_bpjs: true,
  },
  {
    id: "OBT003",
    nama: "Ibuprofen",
    jenis: "bebas",
    stok: 200,
    harga: 7500,
    dosisPerKg: 10,
    maksDosisHarian: 3200,
    kontraindikasi: ["alergi_nsaid", "tukak_lambung", "gangguan_ginjal"],
    dicover_asuransi: true,
    dicover_bpjs: false,
  },
  {
    id: "OBT004",
    nama: "Codein",
    jenis: "psikotropika",
    stok: 30,
    harga: 25000,
    dosisPerKg: 0.5,
    maksDosisHarian: 240,
    kontraindikasi: ["alergi_opioid", "depresi_pernapasan", "asma_akut"],
    dicover_asuransi: false,
    dicover_bpjs: false,
  },
  {
    id: "OBT005",
    nama: "Metformin",
    jenis: "keras",
    stok: 100,
    harga: 8000,
    dosisPerKg: 10,
    maksDosisHarian: 2550,
    kontraindikasi: ["gangguan_ginjal", "asidosis_laktat"],
    dicover_asuransi: true,
    dicover_bpjs: true,
  },
  {
    id: "OBT006",
    nama: "Omeprazole",
    jenis: "keras",
    stok: 120,
    harga: 15000,
    dosisPerKg: 1,
    maksDosisHarian: 40,
    kontraindikasi: ["alergi_ppi"],
    dicover_asuransi: true,
    dicover_bpjs: true,
  },
  {
    id: "OBT007",
    nama: "Diazepam",
    jenis: "psikotropika",
    stok: 25,
    harga: 30000,
    dosisPerKg: 0.3,
    maksDosisHarian: 40,
    kontraindikasi: ["alergi_benzodiazepine", "miastenia_gravis", "sleep_apnea"],
    dicover_asuransi: false,
    dicover_bpjs: false,
  },
  {
    id: "OBT008",
    nama: "Cetirizine",
    jenis: "bebas",
    stok: 300,
    harga: 3000,
    dosisPerKg: 0.25,
    maksDosisHarian: 10,
    kontraindikasi: ["alergi_cetirizine", "gangguan_ginjal_berat"],
    dicover_asuransi: false,
    dicover_bpjs: false,
  },
  {
    id: "OBT009",
    nama: "Captopril",
    jenis: "keras",
    stok: 90,
    harga: 10000,
    dosisPerKg: 0.5,
    maksDosisHarian: 450,
    kontraindikasi: ["alergi_ace_inhibitor", "angioedema", "kehamilan"],
    dicover_asuransi: true,
    dicover_bpjs: true,
  },
  {
    id: "OBT010",
    nama: "Vitamin C",
    jenis: "bebas",
    stok: 500,
    harga: 2000,
    dosisPerKg: 5,
    maksDosisHarian: 2000,
    kontraindikasi: [],
    dicover_asuransi: false,
    dicover_bpjs: false,
  },
  {
    id: "OBT011",
    nama: "Dexamethasone",
    jenis: "keras",
    stok: 60,
    harga: 18000,
    dosisPerKg: 0.15,
    maksDosisHarian: 20,
    kontraindikasi: ["infeksi_jamur_sistemik", "alergi_kortikosteroid"],
    dicover_asuransi: true,
    dicover_bpjs: true,
  },
  {
    id: "OBT012",
    nama: "Antasida DOEN",
    jenis: "bebas",
    stok: 250,
    harga: 4000,
    dosisPerKg: 0,          // Dosis tetap, tidak berdasarkan berat
    dosisTetap: 500,        // mg per pemberian
    maksDosisHarian: 4000,
    kontraindikasi: ["gagal_ginjal"],
    dicover_asuransi: false,
    dicover_bpjs: true,
  },
  {
    id: "OBTDUMMY23",
    nama: "ObatDummyTanpaDosis",
    jenis: "bebas",
    stok: 100,
    harga: 1000,
    dosisPerKg: 0,
    dosisTetap: 0,
    maksDosisHarian: 100,
    kontraindikasi: [],
    dicover_asuransi: false,
    dicover_bpjs: false,
  }
];

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  obatList,
};
