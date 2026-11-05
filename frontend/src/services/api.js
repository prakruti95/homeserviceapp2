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
  if (token && !token.startsWith('demo-') && !token.startsWith('token-')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // If response is HTML from a SPA fallback rewrite, reject it as a 404 so caller fallback handlers trigger!
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!doctype') ||
        response.data.trim().startsWith('<!DOCTYPE') ||
        response.data.trim().startsWith('<html'))
    ) {
      const err = new Error('API endpoint returned HTML index fallback');
      err.response = { status: 404, data: { detail: 'API route not found' } };
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    const token = localStorage.getItem('access_token');
    const isDemoOrClientToken = token && (token.startsWith('demo-') || token.startsWith('token-'));

    if (error.response?.status === 401 && !isAuthRoute && !isDemoOrClientToken) {
      const stored = localStorage.getItem('user');
      if (!stored) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        const publicPaths = ['/', '/index.html', '/index', '/about', '/contact', '/services', '/login', '/register'];
        const isPublic = publicPaths.some((p) => window.location.pathname === p || window.location.pathname.startsWith('/services/'));
        if (!isPublic && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    if (error.response?.status !== 401) {
      // Don't toast error on benign 404s, 405s, or server error 500/502/503/504 handled by component fallbacks
      if (
        error.response?.status !== 404 &&
        error.response?.status !== 405 &&
        (error.response?.status || 0) < 500
      ) {
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
