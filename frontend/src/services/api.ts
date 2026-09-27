import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5050/api/v1"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cbt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Auth routes aren't role-scoped -- leave them alone.
  const isAuthCall = config.url?.startsWith("/auth");
  const role = localStorage.getItem("cbt_role");

  if (!isAuthCall && role && config.url) {
    config.url = `/${role}${config.url}`;
  }

  return config;
});

export default api;