import axios, { AxiosError, AxiosResponse } from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// ── Request interceptor: attach token ──────────────────────
api.interceptors.request.use((cfg) => {
  // Lazy import to avoid circular dependency at module-load time
  const { getState } = require('./stores/auth.store');
  const token = getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Response interceptor: handle 401 globally ─────────────
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      const { logout } = require('./stores/auth.store').getState();
      logout();
    }
    return Promise.reject(err);
  }
);

export default api;
