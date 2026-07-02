import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

export const setAuthToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("lms_token", token);
  } else {
    localStorage.removeItem("lms_token");
  }
};

// Request interceptor - add token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("lms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    // Extract express-validator array messages if standard message is not present
    if (error.response?.data && !error.response.data.message && error.response.data.errors) {
      const errorList = error.response.data.errors;
      if (Array.isArray(errorList)) {
        error.response.data.message = errorList.map(err => err.msg).join(", ");
      }
    }

    const message = error.response?.data?.message || "";
    
    // Only logout on genuine token expiration (401), not on permission/access errors (403)
    if (status === 401) {
      const isTokenError =
        message.includes("No token") ||
        message.includes("Unauthorized") ||
        message.includes("expired") ||
        message.includes("invalid token");

      if (isTokenError && typeof window !== "undefined") {
        localStorage.removeItem("lms_token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    // For 403 errors — NEVER log out, always just re-throw so the component can handle it
    return Promise.reject(error);
  }
);

export default api;