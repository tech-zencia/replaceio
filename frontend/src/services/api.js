import axios from "axios";
import { useAuthStore } from "../store/authStore";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token refresh state — shared across all concurrent 401s
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    const { refreshToken, user, setAuth, logout } = useAuthStore.getState();

    if (!refreshToken) {
      logout();
      return Promise.reject(err);
    }

    // Another request is already refreshing — queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }).catch((e) => Promise.reject(e));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${BASE}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });
      const { access_token, refresh_token: newRefresh } = res.data;
      setAuth(user, access_token, newRefresh);
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      processQueue(null, access_token);
      original.headers.Authorization = `Bearer ${access_token}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export const searchProperties = (query, page = 1) =>
  api.post("/api/search", { query, page, limit: 20 }).then((r) => r.data);

export const getProperty = (id) =>
  api.get(`/api/properties/${encodeURIComponent(id)}`).then((r) => r.data);

export const createProperty = (data) =>
  api.post("/api/properties", data).then((r) => r.data);

export const updateProperty = (id, data) =>
  api.put(`/api/properties/${id}`, data).then((r) => r.data);

export const deleteProperty = (id) =>
  api.delete(`/api/properties/${id}`);

export const uploadMedia = (propertyId, files) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return api.post(`/api/properties/${propertyId}/media`, form).then((r) => r.data);
};

export const getUserProperties = (userId) =>
  api.get(`/api/properties/user/${userId}`).then((r) => r.data);

export const getProfile = () =>
  api.get("/api/users/profile").then((r) => r.data);

export const getSavedProperties = () =>
  api.get("/api/users/saved").then((r) => r.data);

export const saveProperty = (id) =>
  api.post(`/api/users/saved/${id}`).then((r) => r.data);

export const unsaveProperty = (id) =>
  api.delete(`/api/users/saved/${id}`).then((r) => r.data);

export const chatMessage = (data) =>
  api.post("/api/chat", data).then((r) => r.data);

export const register = (data) =>
  api.post("/api/auth/register", data).then((r) => r.data);

export const login = (data) =>
  api.post("/api/auth/login", data).then((r) => r.data);

export default api;
