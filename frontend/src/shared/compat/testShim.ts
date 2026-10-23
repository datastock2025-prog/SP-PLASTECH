import { api } from '../../lib/api-client';

/**
 * Isolated REST database fixture for legacy tests and e2e test execution.
 * Replaces the deprecated legacy db adapter with clean REST domain passthroughs.
 */
export const legacyDbShim = {
  findMany: async <T = any>(table: string, _opts?: any): Promise<T[]> => {
    try {
      const endpoint = `/${table.replace(/_/g, '-')}`;
      const res = await api.get<any>(endpoint, { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
  findOne: async <T = any>(table: string, id: string): Promise<T | null> => {
    try {
      const endpoint = `/${table.replace(/_/g, '-')}/${encodeURIComponent(id)}`;
      const res = await api.get<any>(endpoint);
      return res?.data?.data || res?.data || null;
    } catch {}
    return null;
  },
  upsert: async <T = any>(table: string, item: any, key: string = 'id'): Promise<T> => {
    const id = item[key] || item.id;
    const endpoint = `/${table.replace(/_/g, '-')}`;
    if (id) {
      try {
        const res = await api.patch<any>(`${endpoint}/${encodeURIComponent(id)}`, item);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row;
      } catch {}
    }
    try {
      const res = await api.post<any>(endpoint, item);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row;
    } catch {}
    return item;
  },
  delete: async (table: string, id: string): Promise<boolean> => {
    try {
      await api.delete(`/${table.replace(/_/g, '-')}/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },
};
