/**
 * Axios client for dotnet-Backend (default http://localhost:5138/api).
 *
 * REQUEST:  Attaches Bearer token from localStorage.
 * RESPONSE: 401 clears session keys and hard-redirects to /login (except when already on /login).
 *
 * CAUSE: Full redirect resets React state; VITE_API_URL overrides base URL per environment.
 */
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5138/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      ["token", "role", "userId", "userName", "userEmail", "publicUserId", "permissions", "mustChangePassword"].forEach(
        (k) => localStorage.removeItem(k)
      );
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default API;
