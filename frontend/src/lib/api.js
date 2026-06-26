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
    
    // Only logout on token expiration, not on permission errors
    if (status === 403) {
      // Check if it's a permission error (not token expiration)
      const isPermissionError = 
        message.includes("Cannot delete") ||
        message.includes("don't have permission") ||
        message.includes("not authorized") ||
        message.includes("only delete books you added");
      
      if (isPermissionError) {
        // Just re-throw the error - let the component show the message
        return Promise.reject(error);
      }
      
      // Token expired or invalid - logout and redirect
      if (typeof window !== "undefined") {
        localStorage.removeItem("lms_token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;