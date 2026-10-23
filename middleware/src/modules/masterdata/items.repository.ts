import { eq, and, isNull, sql, desc, asc, or, ilike, inArray, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { items } from '../../schema/erp.js';
import { ITEM_SELECT_COLUMNS } from '../../schema/items.js';

// Fields a client must never set (tenancy, identity, OCC, audit, soft delete)
const PROTECTED_FIELDS = [
  'id', 'tenantId', 'version', 'deletedAt', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'tenant_id', 'deleted_at', 'created_at', 'updated_at', 'created_by', 'updated_by',
] as const;

function sanitize<T extends Record<string, any>>(data: T | undefined): Partial<T> {
  const out: Record<string, any> = {};
  const columns = items as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(data ?? {})) {
    if ((PROTECTED_FIELDS as readonly string[]).includes(k)) continue;
    if (!(k in columns) || v === undefined) continue; // reject unknown fields
    out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return out as Partial<T>;
}

const SORTABLE = new Set([
  'code', 'name', 'category', 'status', 'approval', 'stock', 'cost', 'sellingPrice', 'createdAt', 'updatedAt',
]);

export type ItemRow = typeof items.$inferSelect;
export type NewItemInput = typeof items.$inferInsert;

export interface ItemListOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  approval?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  plantId?: string;
}

export interface ItemSummaryMetrics {
  total: number;
  finishedGoods: number;
  rawMaterials: number;
  masterbatch: number;
  regrind: number;
  pending: number;
  drafts: number;
  rejected: number;
  lowStock: number;
  active: number;
}

export class DrizzleItemRepository {
  /**
   * Aggregate Metrics: executes a single round-trip query calculating all status metrics
   */
  async getSummary(db: NodePgDatabase<any>, tenantId: string): Promise<ItemSummaryMetrics> {
    const [summary] = await db
      .select({
        total: sql<number>`count(*)::int`,
        finishedGoods: sql<number>`count(*) FILTER (WHERE ${items.entityType} IN ('Finished Good', 'Semi-Finished Good', 'Finished Molded Component') OR ${items.category} IN ('Finished Good', 'Finished Goods'))::int`,
        rawMaterials: sql<number>`count(*) FILTER (WHERE ${items.entityType} IN ('Raw Material', 'Raw Materials') OR ${items.category} IN ('Raw Material', 'Raw Materials'))::int`,
        masterbatch: sql<number>`count(*) FILTER (WHERE ${items.entityType} = 'Masterbatch' OR ${items.category} = 'Masterbatch')::int`,
        regrind: sql<number>`count(*) FILTER (WHERE ${items.entityType} = 'Regrind' OR ${items.category} = 'Regrind')::int`,
        pending: sql<number>`count(*) FILTER (WHERE ${items.approval} = 'pending')::int`,
        drafts: sql<number>`count(*) FILTER (WHERE ${items.approval} = 'draft')::int`,
        rejected: sql<number>`count(*) FILTER (WHERE ${items.approval} = 'rejected')::int`,
        lowStock: sql<number>`count(*) FILTER (WHERE ${items.stock} <= 0 OR ${items.status} = 'low' OR ${items.stock} <= ${items.reorderPoint})::int`,
        active: sql<number>`count(*) FILTER (WHERE ${items.status} = 'active' AND (${items.approval} IS NULL OR ${items.approval} IN ('approved', 'released')))::int`,
      })
      .from(items)
      .where(and(eq(items.tenantId, tenantId), isNull(items.deletedAt)));

    return summary ?? {
      total: 0,
      finishedGoods: 0,
      rawMaterials: 0,
      masterbatch: 0,
      regrind: 0,
      pending: 0,
      drafts: 0,
      rejected: 0,
      lowStock: 0,
      active: 0,
    };
  }

  /**
   * Paginated Item Catalog with selective column projection, search, and filtering
   */
  async findPaginated(
    db: NodePgDatabase<any>,
    tenantId: string,
    opts: ItemListOptions = {}
  ): Promise<{ data: ItemRow[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = Math.max(1, Number(opts.page || 1));
    const limit = Math.min(100, Math.max(1, Number(opts.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [
      eq(items.tenantId, tenantId),
      isNull(items.deletedAt),
    ];

    if (opts.plantId) {
      conditions.push(eq(items.plantId, opts.plantId));
    }
    if (opts.category) {
      conditions.push(eq(items.category, opts.category));
    }
    if (opts.status) {
      conditions.push(eq(items.status, opts.status));
    }
    if (opts.approval) {
      conditions.push(eq(items.approval, opts.approval));
    }
    if (opts.search && opts.search.trim()) {
      const q = `%${opts.search.trim()}%`;
      conditions.push(
        or(
          ilike(items.code, q),
          ilike(items.name, q),
          ilike(items.description, q),
          ilike(items.moldCode, q),
          ilike(items.supplier, q)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Count total rows
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(whereClause);

    // Sort order (allowlist only)
    const sortKey = opts.sortBy && SORTABLE.has(opts.sortBy) ? opts.sortBy : 'createdAt';
    const sortField = (items as any)[sortKey];
    const orderFn = opts.sortOrder === 'asc' ? asc : desc;

    // Fetch data page
    const rows = await db
      .select(ITEM_SELECT_COLUMNS)
      .from(items)
      .where(whereClause)
      .orderBy(orderFn(sortField))
      .limit(limit)
      .offset(offset);

    const total = Number(count || 0);
    return {
      data: rows as ItemRow[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find single item by ID with multi-tenant isolation
   */
  async findById(db: NodePgDatabase<any>, tenantId: string, id: string): Promise<ItemRow | null> {
    const [row] = await db
      .select(ITEM_SELECT_COLUMNS)
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.id, id), isNull(items.deletedAt)))
      .limit(1);

    return (row as ItemRow) ?? null;
  }

  /**
   * Find single item by Code with multi-tenant isolation
   */
  async findByCode(db: NodePgDatabase<any>, tenantId: string, code: string): Promise<ItemRow | null> {
    const [row] = await db
      .select(ITEM_SELECT_COLUMNS)
      .from(items)
      .where(and(eq(items.tenantId, tenantId), eq(items.code, code), isNull(items.deletedAt)))
      .limit(1);

    return (row as ItemRow) ?? null;
  }

  /**
   * Create SKU with multi-tenant assignment and audit stamping
   */
  async create(
    db: NodePgDatabase<any>,
    tenantId: string,
    data: Partial<NewItemInput>,
    actorId: string
  ): Promise<ItemRow> {
    const clean = sanitize(data);
    const [created] = await db
      .insert(items)
      .values({
        ...clean,
        code: String(clean.code ?? '').trim(),
        name: String(clean.name ?? '').trim(),
        category: clean.category!,
        tenantId,
        createdBy: actorId,
        updatedBy: actorId,
        version: 1,
      } as any)
      .returning(ITEM_SELECT_COLUMNS);

    return created as ItemRow;
  }

  /**
   * Update SKU with OCC (Optimistic Concurrency Control) version check
   */
  async update(
    db: NodePgDatabase<any>,
    tenantId: string,
    id: string,
    expectedVersion: number,
    data: Partial<NewItemInput>,
    actorId: string
  ): Promise<ItemRow | null> {
    const [updated] = await db
      .update(items)
      .set({
        ...sanitize(data),
        updatedBy: actorId,
        version: sql`${items.version} + 1`,
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.id, id),
          eq(items.version, expectedVersion),
          isNull(items.deletedAt)
        )
      )
      .returning(ITEM_SELECT_COLUMNS);

    return (updated as ItemRow) ?? null;
  }

  /**
   * Soft delete SKU
   */
  async softDelete(
    db: NodePgDatabase<any>,
    tenantId: string,
    id: string,
    actorId: string
  ): Promise<boolean> {
    const [deleted] = await db
      .update(items)
      .set({
        deletedAt: new Date(),
        updatedBy: actorId,
      })
      .where(and(eq(items.tenantId, tenantId), eq(items.id, id), isNull(items.deletedAt)))
      .returning({ id: items.id });

    return Boolean(deleted);
  }
}

export const itemRepository = new DrizzleItemRepository();
