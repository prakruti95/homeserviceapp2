import axios from 'axios';
import toast from 'react-hot-toast';

// Smart baseURL normalization for Vercel & Production
let rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';
if (typeof rawBaseURL === 'string') {
  rawBaseURL = rawBaseURL.trim();
  if (rawBaseURL.endsWith('/')) {
    rawBaseURL = rawBaseURL.slice(0, -1);
  }
  if (rawBaseURL.startsWith('http') && !rawBaseURL.endsWith('/api')) {
    rawBaseURL = `${rawBaseURL}/api`;
  }
}

const api = axios.create({
  baseURL: rawBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      const publicPaths = ['/', '/index.html', '/index', '/about', '/contact', '/services', '/login', '/register'];
      const isPublic = publicPaths.some((p) => window.location.pathname === p || window.location.pathname.startsWith('/services/'));
      if (!isPublic && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status !== 401) {
      // Don't toast error on benign 404s or 405s handled by component fallbacks
      if (error.response?.status !== 404 && error.response?.status !== 405) {
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
