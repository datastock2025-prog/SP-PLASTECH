import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';

export class OfflineIndexedDbAdapter implements IDatabaseAdapter {
  public readonly providerName = 'offline_db';
  private prefix = 'reboot_erp_db_';
  private memoryCache = new Map<string, any[]>();
  private pendingWrites = new Map<string, any>();

  private getTableKey(table: string): string {
    return `${this.prefix}${table}`;
  }

  private readTable<T>(table: string): T[] {
    // 1. High-speed in-memory cache hit (0ms CPU)
    if (this.memoryCache.has(table)) {
      return this.memoryCache.get(table) as T[];
    }

    // 2. Read from persistent local storage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(this.getTableKey(table));
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : [];
          this.memoryCache.set(table, list);
          return list as T[];
        }
      }
    } catch (e) {
      console.warn(`[OfflineAdapter] read error on ${table}:`, e);
    }

    this.memoryCache.set(table, []);
    return [];
  }

  private writeTable<T>(table: string, data: T[]): void {
    // Update memory cache immediately
    this.memoryCache.set(table, data);

    // Non-blocking asynchronous persistent flush (0ms main thread blocking)
    if (typeof window === 'undefined' || !window.localStorage) return;

    if (this.pendingWrites.has(table)) {
      clearTimeout(this.pendingWrites.get(table));
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(this.getTableKey(table), JSON.stringify(data));
      } catch (e) {
        console.warn(`[OfflineAdapter] async flush error on ${table}:`, e);
      } finally {
        this.pendingWrites.delete(table);
      }
    }, 50);

    this.pendingWrites.set(table, timer);
  }

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    let items = [...this.readTable<T>(table)];

    if (filter?.where) {
      items = items.filter((item: any) =>
        Object.entries(filter.where!).every(([k, v]) => item[k] === v)
      );
    }

    if (filter?.whereIn) {
      items = items.filter((item: any) =>
        Object.entries(filter.whereIn!).every(
          ([k, vals]) => Array.isArray(vals) && vals.includes(item[k])
        )
      );
    }

    if (filter?.whereLike) {
      items = items.filter((item: any) =>
        Object.entries(filter.whereLike!).every(
          ([k, val]) => typeof item[k] === 'string' && item[k].toLowerCase().includes(val.toLowerCase())
        )
      );
    }

    if (filter?.search?.query && filter?.search?.columns?.length) {
      const q = filter.search.query.toLowerCase().trim();
      items = items.filter((item: any) =>
        filter.search!.columns.some((col) => {
          const val = item[col];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        })
      );
    }

    if (filter?.orderBy) {
      let col: string | undefined;
      let asc = true;

      if (typeof filter.orderBy === 'string') {
        col = filter.orderBy;
      } else if (typeof filter.orderBy === 'object' && filter.orderBy !== null) {
        col = filter.orderBy.column;
        asc = filter.orderBy.ascending ?? true;
      }

      if (col) {
        items.sort((a: any, b: any) => {
          const aVal = a[col!];
          const bVal = b[col!];
          if (aVal === bVal) return 0;
          return (aVal > bVal ? 1 : -1) * (asc ? 1 : -1);
        });
      }
    }

    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter?.offset || 0;
      const limit = filter?.limit ? offset + filter.limit : undefined;
      items = items.slice(offset, limit);
    }

    return items;
  }

  public async findOne<T = any>(table: string, idOrKey: string, keyField = 'id'): Promise<T | null> {
    const items = this.readTable<any>(table);
    const found = items.find((i) => String(i[keyField]) === String(idOrKey));
    return (found as T) || null;
  }

  public async count(table: string, filter?: QueryFilter): Promise<number> {
    const list = await this.findMany(table, filter);
    return list.length;
  }

  public async upsert<T = any>(table: string, record: T | T[], conflictKey = 'id'): Promise<T> {
    const items = [...this.readTable<any>(table)];
    const records = Array.isArray(record) ? record : [record];

    // High performance Map for O(1) key indexing during bulk upsert
    const itemMap = new Map<string, number>();
    items.forEach((item, index) => {
      const keyVal = String(item[conflictKey] || item.code || item.id);
      itemMap.set(keyVal, index);
    });

    records.forEach((rec: any) => {
      const keyVal = String(rec[conflictKey] || rec.code || rec.id);
      if (itemMap.has(keyVal)) {
        const idx = itemMap.get(keyVal)!;
        items[idx] = { ...items[idx], ...rec };
      } else {
        items.unshift(rec);
        itemMap.set(keyVal, 0);
      }
    });

    this.writeTable(table, items);
    return Array.isArray(record) ? record[0] : record;
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    return this.upsert(table, record);
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, keyField = 'id'): Promise<T> {
    const items = [...this.readTable<any>(table)];
    const idx = items.findIndex((i) => String(i[keyField]) === String(idOrKey));
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...patch };
      this.writeTable(table, items);
      return items[idx] as T;
    }
    return patch as T;
  }

  public async delete(table: string, idOrKey: string, keyField = 'id'): Promise<boolean> {
    const items = this.readTable<any>(table);
    const filtered = items.filter((i) => String(i[keyField]) !== String(idOrKey));
    this.writeTable(table, filtered);
    return true;
  }

  public async deleteMany(table: string, filter: QueryFilter): Promise<number> {
    let items = this.readTable<any>(table);
    if (filter.where) {
      items = items.filter(
        (item) => !Object.entries(filter.where!).every(([k, v]) => item[k] === v)
      );
      this.writeTable(table, items);
    }
    return 1;
  }

  public subscribe<T = any>(
    _table: string,
    _event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    _callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void {
    return () => {};
  }
}
