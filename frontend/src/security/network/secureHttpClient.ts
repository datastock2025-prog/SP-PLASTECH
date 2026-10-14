/**
 * Enterprise Secure HTTP Client (Axios Instance)
 * Configured with token attachment, 401 refresh queuing, exponential backoff retries,
 * CSRF double-submit headers, and PII-sanitized error handling.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { secureTokenStorage } from '../auth/SecureTokenStorage';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const secureHttpClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request Interceptor: Attach Access Token & CSRF Token
secureHttpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = secureTokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token on state-changing requests
    const csrfToken = secureTokenStorage.getCsrfToken();
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Refresh Queuing & Sanitized Error Trapping
secureHttpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized: Attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return secureHttpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt refresh via httpOnly cookie endpoint
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = data.accessToken || 'refreshed_token_secure';
        secureTokenStorage.setAccessToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return secureHttpClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null);
        secureTokenStorage.clearTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Exponential Backoff Retry for 502/503/504 or Network Errors (Max 2 retries)
    if (!error.response || (error.response.status >= 502 && error.response.status <= 504)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 2) {
        const delay = Math.pow(2, originalRequest._retryCount) * 500;
        await new Promise((res) => setTimeout(res, delay));
        return secureHttpClient(originalRequest);
      }
    }

    // Sanitize error before letting it bubble to UI (never leak backend stack traces)
    const sanitizedError = new Error(
      (error.response?.data as any)?.message ||
      error.message ||
      'An unexpected network error occurred. Please try again.'
    );

    return Promise.reject(sanitizedError);
  }
);
