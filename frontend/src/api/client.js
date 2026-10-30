import axios from "axios";

let rawApiUrl = (import.meta.env.VITE_API_URL || "").trim();

// Smart fallback: if no env var is provided, use the deployed Render backend when not running locally
if (!rawApiUrl) {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    rawApiUrl = "https://placement-coordinator-management-system.onrender.com/api";
  } else {
    rawApiUrl = "http://localhost:5000/api";
  }
}

// Ensure the base URL ends with /api (strip trailing slashes first)
rawApiUrl = rawApiUrl.replace(/\/+$/, "");
if (!rawApiUrl.endsWith("/api")) {
  rawApiUrl += "/api";
}
const API_URL = rawApiUrl;

const client = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-logout on 401 ─────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login without import cycle
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
