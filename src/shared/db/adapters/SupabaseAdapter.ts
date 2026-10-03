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

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    let query = this.client.from(table).select(filter?.select || '*');

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
      console.debug(`[SupabaseAdapter] findMany(${table}) note:`, error.message);
      return [];
    }
    return (data || []) as T[];
  }

  public async findOne<T = any>(table: string, idOrKey: string, keyField = 'id'): Promise<T | null> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq(keyField, idOrKey)
      .maybeSingle();

    if (error) {
      console.debug(`[SupabaseAdapter] findOne(${table}, ${idOrKey}) note:`, error.message);
      return null;
    }
    return (data as T) || null;
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    let query = this.client.from(table).select('*', { count: 'exact', head: true });
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          query = query.eq(key, val);
        }
      });
    }
    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey?: string): Promise<T> {
    const options = conflictKey ? { onConflict: conflictKey } : undefined;
    const { data, error } = await this.client
      .from(table)
      .upsert(record as any, options)
      .select();

    if (error) {
      console.debug(`[SupabaseAdapter] upsert(${table}) note:`, error.message);
      return Array.isArray(record) ? record[0] : record;
    }
    return (Array.isArray(data) ? data[0] : data) as T;
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    const { data, error } = await this.client
      .from(table)
      .insert(record as any)
      .select()
      .maybeSingle();

    if (error) {
      console.debug(`[SupabaseAdapter] create(${table}) note:`, error.message);
      return record;
    }
    return (data as T) || record;
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, keyField = 'id'): Promise<T> {
    const { data, error } = await this.client
      .from(table)
      .update(patch as any)
      .eq(keyField, idOrKey)
      .select()
      .maybeSingle();

    if (error) {
      console.debug(`[SupabaseAdapter] update(${table}, ${idOrKey}) note:`, error.message);
      return patch as T;
    }
    return (data as T) || (patch as T);
  }

  public async delete(table: string, idOrKey: string, keyField = 'id'): Promise<boolean> {
    const { error } = await this.client.from(table).delete().eq(keyField, idOrKey);
    if (error) {
      console.debug(`[SupabaseAdapter] delete(${table}, ${idOrKey}) note:`, error.message);
      return false;
    }
    return true;
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    let query = this.client.from(table).delete();
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
    const channelName = `realtime_${table}_${Date.now()}`;
    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: event === '*' ? '*' : event, schema: 'public', table },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new as T,
            old: payload.old as T,
            table,
          });
        }
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }
}
