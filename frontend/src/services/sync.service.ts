import { db } from '../shared/db';

export interface OutboxItem<T = any> {
  id: string;
  table: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  clientTimestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  lastError?: string;
}

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private dbName = 'sp_plastech_offline_v1';
  private idb: IDBDatabase | null = null;
  private isSyncing = false;

  private constructor() {
    this.initDb();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncService] Network restored. Flushing outbox to Supabase Cloud...');
        this.flushOutbox();
      });
    }
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  private async initDb(): Promise<IDBDatabase> {
    if (this.idb) return this.idb;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains('outbox')) {
          database.createObjectStore('outbox', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('cached_items')) {
          database.createObjectStore('cached_items', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('cached_work_orders')) {
          database.createObjectStore('cached_work_orders', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.idb = event.target.result;
        resolve(this.idb!);
      };

      request.onerror = (err) => reject(err);
    });
  }

  /**
   * Enqueue a write action to outbox when offline or for optimistic UI
   */
  async enqueueOutbox<T>(tableOrEndpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', payload: T): Promise<string> {
    const database = await this.initDb();
    const id = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const table = tableOrEndpoint.replace(/^\/api\/v1\//, '').replace(/^\//, '').split('/')[0];
    const outboxItem: OutboxItem<T> = {
      id,
      table,
      method,
      payload,
      clientTimestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    return new Promise((resolve, reject) => {
      const tx = database.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.put(outboxItem);
      tx.oncomplete = () => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.flushOutbox();
        }
        resolve(id);
      };
      tx.onerror = (err) => reject(err);
    });
  }

  /**
   * Flush all pending outbox items directly to Supabase Cloud DB
   */
  async flushOutbox(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    let synced = 0;
    let failed = 0;

    const items = await this.getAllPendingOutboxItems();

    for (const item of items) {
      try {
        if (item.method === 'DELETE') {
          const recordId = (item.payload as any)?.id || item.id;
          await db.delete(item.table, recordId, 'id');
        } else {
          await db.upsert(item.table, item.payload, 'id');
        }

        await this.removeOutboxItem(item.id);
        synced++;
      } catch (err: any) {
        item.retryCount++;
        item.lastError = err.message || 'Supabase sync error';
        await this.updateOutboxItem(item);
        failed++;
      }
    }

    this.isSyncing = false;
    return { synced, failed };
  }

  // --- IndexedDB Helper Methods ---
  private async getAllPendingOutboxItems(): Promise<OutboxItem[]> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  }

  private async removeOutboxItem(id: string): Promise<void> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    });
  }

  private async updateOutboxItem(item: OutboxItem): Promise<void> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    });
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();
