import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// Auto-attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;