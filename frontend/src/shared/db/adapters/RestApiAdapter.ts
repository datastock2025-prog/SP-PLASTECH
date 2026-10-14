import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';
import { http, ApiError } from '../../api/http';

export class RestApiAdapter implements IDatabaseAdapter {
  public readonly providerName = 'rest_api';

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    const res = await http.get<any>(`/api/v1/${table}`, {
      params: filter?.where as any,
      signal: filter?.signal,
    });
    const data = res?.data?.data || res?.data?.items || res?.data || res;
    return Array.isArray(data) ? data : [];
  }

  public async findOne<T = any>(table: string, idOrKey: string, _keyField = 'id'): Promise<T | null> {
    try {
      const res = await http.get<any>(`/api/v1/${table}/${idOrKey}`);
      return (res?.data?.data || res?.data || res || null) as T;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    const res = await http.get<any>(`/api/v1/${table}/count`, {
      params: filter?.where as any,
      signal: filter?.signal,
    });
    return Number(res?.data?.count ?? res?.count ?? 0);
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey?: string): Promise<T> {
    const single = Array.isArray(record) ? record[0] : record;
    const res = await http.post<any>(`/api/v1/${table}`, single);
    return (res?.data?.data || res?.data || res) as T;
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    const res = await http.post<any>(`/api/v1/${table}`, record);
    return (res?.data?.data || res?.data || res) as T;
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, _keyField = 'id'): Promise<T> {
    const res = await http.patch<any>(`/api/v1/${table}/${idOrKey}`, patch);
    return (res?.data?.data || res?.data || res) as T;
  }

  public async delete(table: string, idOrKey: string, _keyField = 'id'): Promise<boolean> {
    await http.delete(`/api/v1/${table}/${idOrKey}`);
    return true;
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    const res = await http.post<any>(`/api/v1/${table}/bulk-delete`, { filter });
    return Number(res?.data?.count ?? res?.count ?? 0);
  }

  public subscribe<T = any>(
    _table: string,
    _event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    _callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void {
    return () => {};
  }
}
