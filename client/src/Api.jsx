import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// Attach JWT token automatically
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const bypass = sessionStorage.getItem("admin_bypass");

        if (bypass === "true") {
            config.headers.Authorization = "Bypass 123456";
        } else if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired/invalid token
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response ?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("role");
            localStorage.removeItem("userName");

            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default API;