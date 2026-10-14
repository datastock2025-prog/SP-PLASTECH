import { http } from '../shared/api/http';
import { ApiResponse, RequestOptions } from '../types/api.types';

export const apiClient = {
  async get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await http.get<any>(url, {
      params: options?.params as any,
      headers: options?.headers as any,
    });
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
    return {
      data: (data as T) ?? ([] as any),
      success: true,
      meta: { timestamp: new Date().toISOString(), ...(res?.meta ?? {}) },
    };
  },

  async post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await http.post<any>(url, data, {
      params: options?.params as any,
      headers: options?.headers as any,
    });
    const payload = res && typeof res === 'object' && 'data' in res ? res.data : res;
    return {
      data: payload as T,
      success: true,
      meta: { timestamp: new Date().toISOString() },
    };
  },

  async put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await http.put<any>(url, data, {
      params: options?.params as any,
      headers: options?.headers as any,
    });
    const payload = res && typeof res === 'object' && 'data' in res ? res.data : res;
    return {
      data: payload as T,
      success: true,
      meta: { timestamp: new Date().toISOString() },
    };
  },

  async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await http.patch<any>(url, data, {
      params: options?.params as any,
      headers: options?.headers as any,
    });
    const payload = res && typeof res === 'object' && 'data' in res ? res.data : res;
    return {
      data: payload as T,
      success: true,
      meta: { timestamp: new Date().toISOString() },
    };
  },

  async delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    await http.delete<any>(url, {
      params: options?.params as any,
      headers: options?.headers as any,
    });
    return {
      data: null as any,
      success: true,
      meta: { timestamp: new Date().toISOString() },
    };
  },
};

export default apiClient;
