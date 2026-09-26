import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { ApiResponse, RequestOptions } from '../types/api.types';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach in-memory JWT, Tenant ID & Correlation ID
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, activeTenantId } = useAuthStore.getState();

    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (activeTenantId) {
      config.headers['X-Tenant-ID'] = activeTenantId;
    }

    config.headers['X-Correlation-ID'] = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Silent 401 Refresh Queue
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;

        if (newToken) {
          useAuthStore.getState().setToken(newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return axiosInstance(originalRequest);
        } else {
          processQueue(new Error('No token returned from refresh endpoint'), null);
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const apiClient = {
  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await axiosInstance.get(url, {
      params: options?.params,
      headers: options?.headers,
    });
    return res.data;
  },

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await axiosInstance.post(url, data, {
      params: options?.params,
      headers: options?.headers,
    });
    return res.data;
  },

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await axiosInstance.put(url, data, {
      params: options?.params,
      headers: options?.headers,
    });
    return res.data;
  },

  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await axiosInstance.patch(url, data, {
      params: options?.params,
      headers: options?.headers,
    });
    return res.data;
  },

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await axiosInstance.delete(url, {
      params: options?.params,
      headers: options?.headers,
    });
    return res.data;
  },
};
