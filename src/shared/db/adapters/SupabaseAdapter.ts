import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';

export class SupabaseAdapter implements IDatabaseAdapter {
  public readonly providerName = 'supabase';
  private client: SupabaseClient;

  constructor(url: string, anonKey: string, existingClient?: SupabaseClient) {
    if (existingClient) {
      this.client = existingClient;
    } else {
      this.client = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        db: {
          schema: 'public',
        },
      });
    }
  }

  public getRawClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Normalizes table aliases to actual Supabase database table names.
   * Maps 'profiles', 'users', 'user_profiles' to canonical 'users_profile' table.
   */
  public normalizeTable(table: string): string {
    const clean = (table || '').trim().toLowerCase();
    if (clean === 'profiles' || clean === 'users' || clean === 'user_profiles') {
      return 'users_profile';
    }
    return table;
  }

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    const resolvedTable = this.normalizeTable(table);
    let query = this.client.from(resolvedTable).select(filter?.select || '*');

    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          query = query.eq(key, val);
        }
      });
    }

    if (filter?.whereIn) {
      Object.entries(filter.whereIn).forEach(([key, vals]) => {
        if (Array.isArray(vals) && vals.length > 0) {
          query = query.in(key, vals);
        }
      });
    }

    if (filter?.whereLike) {
      Object.entries(filter.whereLike).forEach(([key, val]) => {
        if (val) {
          query = query.ilike(key, `%${val}%`);
        }
      });
    }

    if (filter?.search?.query && filter?.search?.columns?.length) {
      const q = filter.search.query.trim();
      if (q) {
        const orClauses = filter.search.columns.map((col) => `${col}.ilike.%${q}%`).join(',');
        query = query.or(orClauses);
      }
    }

    if (filter?.orderBy) {
      let sortCol: string | undefined;
      let isAscending = true;

      if (typeof filter.orderBy === 'string') {
        sortCol = filter.orderBy;
      } else if (typeof filter.orderBy === 'object' && filter.orderBy !== null) {
        sortCol = (filter.orderBy as any).column || (filter.orderBy as any).field;
        isAscending = (filter.orderBy as any).ascending ?? true;
      }

      // Strictly validate column name: must be non-empty and NOT the string 'undefined' or 'null'
      if (
        sortCol &&
        typeof sortCol === 'string' &&
        sortCol.trim().length > 0 &&
        sortCol.trim() !== 'undefined' &&
        sortCol.trim() !== 'null'
      ) {
        query = query.order(sortCol.trim(), { ascending: isAscending });
      }
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    if (filter?.offset) {
      const limit = filter.limit || 25;
      query = query.range(filter.offset, filter.offset + limit - 1);
    }

    if (filter?.signal) {
      query = query.abortSignal(filter.signal);
    }

    const { data, error } = await query;
    if (error) {
      // Self-healing: If specific select columns fail (e.g. column does not exist / 42703 / PGRST100), retry with select('*')
      if (filter?.select && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist') || error.code === 'PGRST100')) {
        console.warn(`[SupabaseAdapter] Column mismatch in table "${resolvedTable}" (${filter.select}). Auto-retrying with select('*')...`);
        try {
          let retryQuery = this.client.from(resolvedTable).select('*');
          if (filter.limit) retryQuery = retryQuery.limit(filter.limit);
          const retryRes = await retryQuery;
          if (!retryRes.error && Array.isArray(retryRes.data)) {
            return retryRes.data as T[];
          }
        } catch {}
      }

      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
        console.debug(`[SupabaseAdapter] Table "${resolvedTable}" (code: ${error.code}) schema cache fallback.`);
        // Graceful user/profile schema fallback
        if (resolvedTable === 'users_profile') {
          try {
            const fallbackQuery = this.client.from('users').select(filter?.select || '*');
            const fallbackRes = await fallbackQuery;
            if (!fallbackRes.error && Array.isArray(fallbackRes.data)) {
              return fallbackRes.data as T[];
            }
          } catch {}
        }
      } else if (error.message?.includes('aborted') || error.name === 'AbortError') {
        // Safe lifecycle unmount cancellation
      } else {
        console.warn(`[SupabaseAdapter] findMany(${resolvedTable}) query issue:`, error.message);
      }
      return [];
    }
    return (data || []) as T[];
  }

  public async findOne<T = any>(table: string, idOrKey: string, keyField = 'id'): Promise<T | null> {
    const resolvedTable = this.normalizeTable(table);
    const { data, error } = await this.client
      .from(resolvedTable)
      .select('*')
      .eq(keyField, idOrKey)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
        console.debug(`[SupabaseAdapter] findOne on "${resolvedTable}" (code: ${error.code}) schema cache fallback.`);
        if (resolvedTable === 'users_profile') {
          try {
            const fallback = await this.client.from('users').select('*').eq(keyField, idOrKey).maybeSingle();
            if (!fallback.error && fallback.data) return fallback.data as T;
          } catch {}
        }
      }
      return null;
    }
    return (data as T) || null;
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    try {
      const resolvedTable = this.normalizeTable(table);
      let query = this.client.from(resolvedTable).select('id', { count: 'exact', head: true });
      if (filter?.where) {
        Object.entries(filter.where).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            query = query.eq(key, val);
          }
        });
      }
      if (filter?.whereIn) {
        Object.entries(filter.whereIn).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            query = query.in(key, values);
          }
        });
      }
      if (filter?.search?.query && filter?.search?.columns?.length) {
        const q = filter.search.query.trim();
        if (q) {
          const orClauses = filter.search.columns.map((col) => `${col}.ilike.%${q}%`).join(',');
          query = query.or(orClauses);
        }
      }
      if (filter?.signal) {
        query = query.abortSignal(filter.signal);
      }
      const { count, error } = await query;
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) {
          console.debug(`[SupabaseAdapter] count(${resolvedTable}) table pending sync.`);
        }
        return 0;
      }
      return count || 0;
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        // Graceful client cancellation
        return 0;
      }
      return 0;
    }
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey?: string): Promise<T> {
    const resolvedTable = this.normalizeTable(table);
    const options = conflictKey ? { onConflict: conflictKey } : undefined;
    const { data, error } = await this.client
      .from(resolvedTable)
      .upsert(record as any, options)
      .select('*');

    if (error) {
      if (error.code !== 'PGRST205' && error.code !== '42P01') {
        console.debug(`[SupabaseAdapter] upsert(${resolvedTable}) note:`, error.message);
      }
      return Array.isArray(record) ? record[0] : record;
    }
    if (Array.isArray(data) && data.length > 0) {
      return (Array.isArray(record) ? data : data[0]) as T;
    }
    return (data || (Array.isArray(record) ? record[0] : record)) as T;
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    const resolvedTable = this.normalizeTable(table);
    const { data, error } = await this.client
      .from(resolvedTable)
      .insert(record as any)
      .select()
      .maybeSingle();

    if (error) {
      console.debug(`[SupabaseAdapter] create(${resolvedTable}) note:`, error.message);
      return record;
    }
    return (data as T) || record;
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, keyField = 'id'): Promise<T> {
    const resolvedTable = this.normalizeTable(table);
    const { data, error } = await this.client
      .from(resolvedTable)
      .update(patch as any)
      .eq(keyField, idOrKey)
      .select()
      .maybeSingle();

    if (error) {
      console.debug(`[SupabaseAdapter] update(${resolvedTable}, ${idOrKey}) note:`, error.message);
      return patch as T;
    }
    return (data as T) || (patch as T);
  }

  public async delete(table: string, idOrKey: string, keyField = 'id'): Promise<boolean> {
    const resolvedTable = this.normalizeTable(table);
    const { error } = await this.client.from(resolvedTable).delete().eq(keyField, idOrKey);
    if (error) {
      console.debug(`[SupabaseAdapter] delete(${resolvedTable}, ${idOrKey}) note:`, error.message);
      return false;
    }
    return true;
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    const resolvedTable = this.normalizeTable(table);
    let query = this.client.from(resolvedTable).delete();
    if (filter.where) {
      Object.entries(filter.where).forEach(([key, val]) => {
        query = query.eq(key, val);
      });
    }
    const { error } = await query;
    return error ? 0 : 1;
  }

  public subscribe<T = any>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void {
    const resolvedTable = this.normalizeTable(table);
    const channelName = `realtime_${resolvedTable}_${Date.now()}`;
    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: event === '*' ? '*' : event, schema: 'public', table: resolvedTable },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new as T,
            old: payload.old as T,
            table: resolvedTable,
          });
        }
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }
}
