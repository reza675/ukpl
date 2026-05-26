/**
 * API Client - Axios wrapper untuk komunikasi ke Backend
 */
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 detik (karena ada simulasi delay 2 detik di backend)
});

/**
 * hitungDosis - Memanggil API kalkulator dosis
 */
export async function hitungDosis(data) {
  const response = await apiClient.post("/dosis/hitung", data);
  return response.data;
}

/**
 * prosesTransaksi - Memanggil API kasir untuk proses pembayaran
 */
export async function prosesTransaksi(data) {
  const response = await apiClient.post("/kasir/proses", data);
  return response.data;
}

/**
 * getObatList - Mengambil daftar obat
 */
export async function getObatList() {
  const response = await apiClient.get("/kasir/obat");
  return response.data;
}

/**
 * getMemberList - Mengambil daftar member
 */
export async function getMemberList() {
  const response = await apiClient.get("/kasir/member");
  return response.data;
}

export default apiClient;
