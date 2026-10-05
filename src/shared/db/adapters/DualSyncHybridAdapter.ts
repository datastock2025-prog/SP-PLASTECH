import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';
import { SupabaseAdapter } from './SupabaseAdapter';
import { OfflineIndexedDbAdapter } from './OfflineIndexedDbAdapter';
import { supabase } from '../../supabaseClient';

/**
 * Dual-Sync Hybrid Database Adapter
 * 
 * Capabilities:
 * - Direct connection to Supabase Cloud DB (PostgreSQL) across all environments.
 * - Local offline resilience & caching via IndexedDB.
 * - Single remote target: Supabase Cloud (No local REST/proxy duplicate calls).
 */
export class DualSyncHybridAdapter implements IDatabaseAdapter {
  public readonly providerName = 'dual_sync_hybrid';
  private localAdapter: OfflineIndexedDbAdapter;
  private cloudAdapter: SupabaseAdapter;

  constructor() {
    this.localAdapter = new OfflineIndexedDbAdapter();

    const cloudUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
      'https://gqrelwvmeoqvfnanoutz.supabase.co';
    const cloudAnonKey =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
      'sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R';

    this.cloudAdapter = new SupabaseAdapter(cloudUrl, cloudAnonKey, supabase);
  }

  private getPrimaryRemoteAdapter(): IDatabaseAdapter {
    return this.cloudAdapter;
  }

  public async findOne<T = any>(table: string, idOrKey: string, keyField = 'id'): Promise<T | null> {
    // 1. Try local cache first for 0ms response
    const localItem = await this.localAdapter.findOne<T>(table, idOrKey, keyField);
    if (localItem) {
      // Background revalidate from Supabase Cloud
      this.cloudAdapter.findOne<T>(table, idOrKey, keyField).then((remoteItem) => {
        if (remoteItem) {
          this.localAdapter.upsert(table, remoteItem);
        }
      }).catch(() => {});
      return localItem;
    }

    // 2. Fetch from Supabase Cloud
    try {
      const remoteItem = await this.cloudAdapter.findOne<T>(table, idOrKey, keyField);
      if (remoteItem) {
        await this.localAdapter.upsert(table, remoteItem);
        return remoteItem;
      }
    } catch {
      // Offline fallback
    }

    return localItem;
  }

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    // 1. Check local cache
    const localItems = await this.localAdapter.findMany<T>(table, filter);

    // 2. Hydrate from Supabase Cloud DB
    try {
      const remoteItems = await this.cloudAdapter.findMany<T>(table, filter);
      if (Array.isArray(remoteItems) && remoteItems.length > 0) {
        // Asynchronously populate local cache in a single bulk batch
        queueMicrotask(() => {
          this.localAdapter.upsert(table, remoteItems).catch(() => {});
        });
        return remoteItems;
      }
    } catch {
      // Offline fallback: rely on local adapter
    }

    return localItems;
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    try {
      return await this.cloudAdapter.count(table, filter);
    } catch {
      return await this.localAdapter.count(table, filter);
    }
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    // 1. Write to local storage immediately
    const localCreated = await this.localAdapter.create<T>(table, record);

    // 2. Sync to Supabase Cloud asynchronously
    this.cloudAdapter.create<T>(table, record).catch((err) => {
      console.warn(`[DualSync] Background Supabase Cloud create failed for ${table}:`, err);
    });

    return localCreated;
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey = 'id'): Promise<T> {
    // 1. Instant local persistence
    const localUpserted = await this.localAdapter.upsert<T>(table, record, conflictKey);

    // 2. Sync to Supabase Cloud
    this.cloudAdapter.upsert<T>(table, record, conflictKey).catch((err) => {
      console.warn(`[DualSync] Background Supabase Cloud upsert failed for ${table}:`, err);
    });

    return localUpserted;
  }

  public async update<T = any>(
    table: string,
    idOrKey: string,
    patch: Partial<T>,
    keyField = 'id'
  ): Promise<T> {
    // 1. Update local storage
    const localUpdated = await this.localAdapter.update<T>(table, idOrKey, patch, keyField);

    // 2. Sync to Supabase Cloud
    this.cloudAdapter.update<T>(table, idOrKey, patch, keyField).catch((err) => {
      console.warn(`[DualSync] Background Supabase Cloud update failed for ${table}:`, err);
    });

    return localUpdated;
  }

  public async delete(table: string, idOrKey: string, keyField = 'id'): Promise<boolean> {
    // 1. Delete from local storage
    const localDeleted = await this.localAdapter.delete(table, idOrKey, keyField);

    // 2. Sync to Supabase Cloud
    this.cloudAdapter.delete(table, idOrKey, keyField).catch((err) => {
      console.warn(`[DualSync] Background Supabase Cloud delete failed for ${table}:`, err);
    });

    return localDeleted;
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    const localCount = await this.localAdapter.deleteMany(table, filter);
    this.cloudAdapter.deleteMany(table, filter).catch((err) => {
      console.warn(`[DualSync] Background Supabase Cloud deleteMany failed for ${table}:`, err);
    });
    return localCount;
  }

  public subscribe<T = any>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void {
    const unsubLocal = this.localAdapter.subscribe<T>(table, event, callback);
    const unsubRemote = this.cloudAdapter.subscribe<T>(table, event, callback);

    return () => {
      unsubLocal();
      unsubRemote();
    };
  }
}
