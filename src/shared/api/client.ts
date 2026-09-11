import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Centralized API Client (BFF / Microservice Gateway compliant)
// Security directive: Uses HttpOnly cookies (withCredentials: true), no tokens in localStorage.
export const apiClient: AxiosInstance = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api',
  timeout: 30000,
  withCredentials: true, // Send and receive HttpOnly cookies securely
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request Interceptor: CSRF token propagation & request metadata
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Read CSRF token from cookie if present
    const match = typeof document !== 'undefined' ? document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)')) : null;
    if (match && config.headers) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[2]);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling and 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Dispatched via custom event so React Router / Auth store handles redirect gracefully
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } else if (status === 403) {
        window.dispatchEvent(new CustomEvent('auth:forbidden'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
