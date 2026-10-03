import { IDatabaseAdapter, QueryFilter, RealtimeChangeEvent } from '../types';

export class OfflineIndexedDbAdapter implements IDatabaseAdapter {
  public readonly providerName = 'offline_db';
  private prefix = 'reboot_erp_db_';

  private getTableKey(table: string): string {
    return `${this.prefix}${table}`;
  }

  private readTable<T>(table: string): T[] {
    try {
      const raw = localStorage.getItem(this.getTableKey(table));
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn(`[OfflineAdapter] read error on ${table}:`, e);
    }
    return [];
  }

  private writeTable<T>(table: string, data: T[]): void {
    try {
      localStorage.setItem(this.getTableKey(table), JSON.stringify(data));
    } catch (e) {
      console.warn(`[OfflineAdapter] write error on ${table}:`, e);
    }
  }

  public async findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]> {
    let items = this.readTable<T>(table);

    if (filter?.where) {
      items = items.filter((item: any) =>
        Object.entries(filter.where!).every(([k, v]) => item[k] === v)
      );
    }

    if (filter?.orderBy) {
      const col = filter.orderBy.column;
      const asc = filter.orderBy.ascending ?? true;
      items.sort((a: any, b: any) => {
        const aVal = a[col];
        const bVal = b[col];
        if (aVal === bVal) return 0;
        return (aVal > bVal ? 1 : -1) * (asc ? 1 : -1);
      });
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
    const items = this.readTable<any>(table);
    const records = Array.isArray(record) ? record : [record];

    records.forEach((rec: any) => {
      const keyVal = rec[conflictKey] || rec.code || rec.id;
      const idx = items.findIndex((i) => (i[conflictKey] || i.code || i.id) === keyVal);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...rec };
      } else {
        items.unshift(rec);
      }
    });

    this.writeTable(table, items);
    return Array.isArray(record) ? record[0] : record;
  }

  public async create<T = any>(table: string, record: T): Promise<T> {
    return this.upsert(table, record);
  }

  public async update<T = any>(table: string, idOrKey: string, patch: Partial<T>, keyField = 'id'): Promise<T> {
    const items = this.readTable<any>(table);
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
