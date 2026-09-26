export interface OutboxItem<T = any> {
  id: string;
  endpoint: string;
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
  private db: IDBDatabase | null = null;
  private isSyncing = false;

  private constructor() {
    this.initDb();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncService] Network restored. Flushing outbox...');
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
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached_items')) {
          db.createObjectStore('cached_items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached_work_orders')) {
          db.createObjectStore('cached_work_orders', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (err) => reject(err);
    });
  }

  /**
   * Enqueue a write action to outbox when offline or for optimistic UI
   */
  async enqueueOutbox<T>(endpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', payload: T): Promise<string> {
    const db = await this.initDb();
    const id = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const outboxItem: OutboxItem<T> = {
      id,
      endpoint,
      method,
      payload,
      clientTimestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.put(outboxItem);
      tx.oncomplete = () => {
        // If online, immediately attempt flush
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.flushOutbox();
        }
        resolve(id);
      };
      tx.onerror = (err) => reject(err);
    });
  }

  /**
   * Flush all pending outbox items to the server
   */
  async flushOutbox(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    const db = await this.initDb();
    let synced = 0;
    let failed = 0;

    const items = await this.getAllPendingOutboxItems();

    for (const item of items) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Timestamp': String(item.clientTimestamp),
          },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          await this.removeOutboxItem(item.id);
          synced++;
        } else {
          item.retryCount++;
          item.lastError = `HTTP ${response.status}`;
          await this.updateOutboxItem(item);
          failed++;
        }
      } catch (err: any) {
        item.retryCount++;
        item.lastError = err.message;
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
