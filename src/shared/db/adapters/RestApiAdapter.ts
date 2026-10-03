import { apiClient } from '../../api/client';
import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';

export class RestApiAdapter implements IDatabaseAdapter {
  public readonly providerName = 'rest_api';

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    try {
      const res = await apiClient.get<any>(`/${table}`, { params: filter });
      const data = res.data?.data || res.data?.items || res.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.debug(`[RestApiAdapter] findMany(${table}) fallback:`, error);
      return [];
    }
  }

  public async findOne<T = any>(table: string, idOrKey: string, _keyField = 'id'): Promise<T | null> {
    try {
      const res = await apiClient.get<any>(`/${table}/${idOrKey}`);
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    try {
      const res = await apiClient.get<any>(`/${table}/count`, { params: filter });
      return res.data?.count || 0;
    } catch {
      return 0;
    }
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey?: string): Promise<T> {
    try {
      const res = await apiClient.post<any>(`/${table}/upsert`, { record, conflictKey });
      return res.data?.data || res.data || record;
    } catch {
      try {
        const single = Array.isArray(record) ? record[0] : record;
        const res = await apiClient.post<any>(`/${table}`, single);
        return res.data?.data || res.data || record;
      } catch {
        return Array.isArray(record) ? record[0] : record;
      }
    }
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    try {
      const res = await apiClient.post<any>(`/${table}`, record);
      return res.data?.data || res.data || record;
    } catch {
      return record;
    }
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, _keyField = 'id'): Promise<T> {
    try {
      const res = await apiClient.put<any>(`/${table}/${idOrKey}`, patch);
      return res.data?.data || res.data || patch;
    } catch {
      return patch as T;
    }
  }

  public async delete(table: string, idOrKey: string, _keyField = 'id'): Promise<boolean> {
    try {
      await apiClient.delete(`/${table}/${idOrKey}`);
      return true;
    } catch {
      return false;
    }
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    try {
      const res = await apiClient.post<any>(`/${table}/bulk-delete`, { filter });
      return res.data?.count || 1;
    } catch {
      return 0;
    }
  }

  public subscribe<T = any>(
    _table: string,
    _event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    _callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void {
    // REST API adapter uses WebSocket / SSE via universalSyncManager
    return () => {};
  }
}
