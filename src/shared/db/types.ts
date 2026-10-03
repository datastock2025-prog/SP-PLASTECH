// ============================================================================
// UNIVERSAL DATABASE ADAPTER INTERFACE — VENDOR-AGNOSTIC DATA ACCESS LAYER
// Enables zero-effort database provider swapping (Supabase, NestJS REST API,
// PostgreSQL/Prisma, Firebase, IndexedDB) without changing any UI or domain logic.
// ============================================================================

export interface QueryFilter {
  select?: string;
  where?: Record<string, any>;
  whereIn?: Record<string, any[]>;
  whereLike?: Record<string, string>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface DbResult<T> {
  data: T | null;
  error: Error | null;
  count?: number;
  status: number;
}

export interface RealtimeChangeEvent<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  new: T;
  old: T;
  table: string;
}

export interface IDatabaseAdapter {
  readonly providerName: string;

  // Query Operations
  findMany<T = any>(table: string, filter?: QueryFilter): Promise<T[]>;
  findOne<T = any>(table: string, idOrKey: string, keyField?: string): Promise<T | null>;
  count(table: string, filter?: QueryFilter): Promise<number>;

  // Mutation Operations
  upsert<T = any>(table: string, record: T | T[], conflictKey?: string): Promise<T>;
  create<T = any>(table: string, record: T): Promise<T>;
  update<T = any>(table: string, idOrKey: string, patch: Partial<T>, keyField?: string): Promise<T>;
  delete(table: string, idOrKey: string, keyField?: string): Promise<boolean>;
  deleteMany(table: string, filter: QueryFilter): Promise<number>;

  // Real-time Universal Subscription
  subscribe<T = any>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: RealtimeChangeEvent<T>) => void
  ): () => void;
}
