import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Inject token + siapkan header sesuai payload
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  config.headers = config.headers || {};

  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Jangan set Content-Type kalau FormData (biarkan axios yg set boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    // default JSON untuk payload biasa
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Handle 401 -> logout paksa
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      if (location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Helper: ubah path relatif dari BE (/uploads/...) jadi URL penuh
export const publicUrl = (p) =>
  !p ? '' : p.startsWith('http') ? p : `${import.meta.env.VITE_API_URL}${p}`;

export default api;
