import axios from "axios";
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // Send cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});
 
// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────
// Attach access token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────
// If token expired (401), auto refresh and retry the request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
 
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
 
      try {
        const res = await axios.post(
          "/api/auth/refresh-token",
          {},
          { withCredentials: true }
        );
 
        const newToken = res.data.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
 
        return api(originalRequest); // Retry original request
      } catch {
        // Refresh failed — clear storage and redirect to login
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
 
    return Promise.reject(error);
  }
);
 
export default api;