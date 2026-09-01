import axios from "axios";

// Render's `fromService: url` gives the service root URL (no /api suffix).
// Ensure we always point to /api regardless of how the env var is set.
const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const baseURL = rawBaseURL.endsWith("/api") ? rawBaseURL : `${rawBaseURL.replace(/\/$/, "")}/api`;

const API = axios.create({ baseURL });

// Request Interceptor - Add token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log out on explicit 401 (Unauthorized), not on other errors
    if (error.response?.status === 401) {
      console.warn("Unauthorized access - token expired or invalid");
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login only if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error: No response from server");
    } else {
      // Other errors
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;