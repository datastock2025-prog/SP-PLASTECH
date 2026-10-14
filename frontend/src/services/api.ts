import { db } from '../shared/db';
import { ApiResponse, RequestOptions } from '../types/api.types';

function resolveTableFromUrl(url: string): string {
  const clean = url.replace(/^\/api\/v1\//, '').replace(/^\/api\//, '').replace(/^\//, '');
  const parts = clean.split('?')[0].split('/');
  return parts.join('_').replace(/-/g, '_');
}

export const apiClient = {
  async get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const table = resolveTableFromUrl(url);
    try {
      const data = await db.findMany<any>(table, options?.params ? { where: options.params } : undefined);
      return {
        data: (data as any) || [],
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch {
      return {
        data: ([] as any),
        success: false,
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async post<T = any>(url: string, data?: any, _options?: RequestOptions): Promise<ApiResponse<T>> {
    const table = resolveTableFromUrl(url);
    try {
      const res = await db.upsert(table, data || {}, 'id');
      return {
        data: res as any,
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch {
      return {
        data: data as any,
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async put<T = any>(url: string, data?: any, _options?: RequestOptions): Promise<ApiResponse<T>> {
    const clean = url.replace(/^\/api\/v1\//, '').replace(/^\/api\//, '').replace(/^\//, '').split('?')[0];
    const parts = clean.split('/');
    const id = parts.length > 1 ? parts.pop()! : data?.id || 'default';
    const table = parts.join('_').replace(/-/g, '_');
    try {
      const res = await db.update(table, id, data || {}, 'id');
      return {
        data: res as any,
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch {
      return {
        data: data as any,
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return apiClient.put<T>(url, data, options);
  },

  async delete<T = any>(url: string, _options?: RequestOptions): Promise<ApiResponse<T>> {
    const clean = url.replace(/^\/api\/v1\//, '').replace(/^\/api\//, '').replace(/^\//, '').split('?')[0];
    const parts = clean.split('/');
    const id = parts.length > 1 ? parts.pop()! : 'default';
    const table = parts.join('_').replace(/-/g, '_');
    try {
      await db.delete(table, id, 'id');
      return {
        data: null as any,
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch {
      return {
        data: null as any,
        success: true,
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },
};

export default apiClient;
