import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});
export async function hitungDosis(data) {
  const response = await apiClient.post("/dosis/hitung", data);
  return response.data;
}


export default apiClient;
