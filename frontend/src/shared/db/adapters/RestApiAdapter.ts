import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';

async function request<T = any>(
  path: string,
  method = 'GET',
  body?: any,
  params?: Record<string, any>
): Promise<any> {
  let url = `/api/v1${path}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) searchParams.append(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

export class RestApiAdapter implements IDatabaseAdapter {
  public readonly providerName = 'rest_api';

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    try {
      const res = await request<any>(`/${table}`, 'GET', undefined, filter?.where);
      const data = res?.data?.data || res?.data?.items || res?.data || res;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.debug(`[RestApiAdapter] findMany(${table}) fallback:`, error);
      return [];
    }
  }

  public async findOne<T = any>(table: string, idOrKey: string, _keyField = 'id'): Promise<T | null> {
    try {
      const res = await request<any>(`/${table}/${idOrKey}`);
      return res?.data?.data || res?.data || res || null;
    } catch {
      return null;
    }
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    try {
      const res = await request<any>(`/${table}/count`, 'GET', undefined, filter?.where);
      return res?.data?.count || res?.count || 0;
    } catch {
      return 0;
    }
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey?: string): Promise<T> {
    try {
      const res = await request<any>(`/${table}/upsert`, 'POST', { record, conflictKey });
      return res?.data?.data || res?.data || record;
    } catch {
      try {
        const single = Array.isArray(record) ? record[0] : record;
        const res = await request<any>(`/${table}`, 'POST', single);
        return res?.data?.data || res?.data || record;
      } catch {
        return Array.isArray(record) ? record[0] : record;
      }
    }
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    try {
      const res = await request<any>(`/${table}`, 'POST', record);
      return res?.data?.data || res?.data || record;
    } catch {
      return record;
    }
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, _keyField = 'id'): Promise<T> {
    try {
      const res = await request<any>(`/${table}/${idOrKey}`, 'PUT', patch);
      return res?.data?.data || res?.data || patch;
    } catch {
      return patch as T;
    }
  }

  public async delete(table: string, idOrKey: string, _keyField = 'id'): Promise<boolean> {
    try {
      await request(`/${table}/${idOrKey}`, 'DELETE');
      return true;
    } catch {
      return false;
    }
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    try {
      const res = await request<any>(`/${table}/bulk-delete`, 'POST', { filter });
      return res?.data?.count || res?.count || 1;
    } catch {
      return 0;
    }
  }

  public subscribe<T = any>(
    _table: string,
    _event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    _callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void {
    // REST API adapter subscription (realtime handled via Supabase Realtime CDC)
    return () => {};
  }
}
