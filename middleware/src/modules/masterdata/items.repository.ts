import { eq, and, isNull, sql, desc, asc, or, ilike, inArray, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { items, auditLogs } from '../../schema/erp.js';
import { ITEM_SELECT_COLUMNS } from '../../schema/items.js';
import { decodeCursor, encodeCursor, type PaginationMeta } from '../../core/pagination.js';

// Fields a client must never set (tenancy, identity, OCC, audit, soft delete)
const PROTECTED_FIELDS = [
  'id', 'tenantId', 'version', 'deletedAt', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'tenant_id', 'deleted_at', 'created_at', 'updated_at', 'created_by', 'updated_by',
] as const;

const NUMERIC_FIELDS = new Set([
  'stock', 'minStock', 'maxStock', 'reorderPoint', 'cost', 'sellingPrice',
  'partWeightGrams', 'runnerWeightGrams', 'cavityCount', 'cycleTime',
  'cycleTimeSeconds', 'safetyStock'
]);

const EXTENDED_METADATA_KEYS = [
  'plant', 'type', 'mfi', 'density', 'moistureLimit', 'moistureSensitive', 'polymerGrade',
  'additivePercentage', 'masterbatchDosage', 'carrierResin', 'heatStability',
  'packagingStandard', 'boxDimensions', 'unitsPerPack', 'machineCompat', 'spareClass',
  'regrind', 'samplingPlan', 'approvedLab', 'qualityTestParams', 'coaRequired',
  'lot', 'qc', 'expiryControlled', 'fefoPicking', 'shelfLifeDays',
  'purchaseUOM', 'salesUOM', 'stockUOM', 'productionUOM', 'conversions',
  'priceTier', 'salesMoq', 'purchaseMoq', 'gstRate',
  'workflowRoute', 'workflowPriority', 'creationNotes', 'documents',
  'approvedBy', 'approvedOn', 'rejectedBy', 'rejectedOn', 'rejectedReason',
  'isWip', 'isDol', 'isAssembly', 'isDeflash', 'shotWeightGrams', 'netWeightGrams',
] as const;

function normalizeInputWithMetadata(
  raw: Record<string, any> | undefined,
  existingMetadata?: Record<string, any> | null
): Record<string, any> {
  if (!raw) return {};
  const d: Record<string, any> = { ...raw };

  // Map frontend ItemMaster aliases to DB columns if DB column not explicitly set
  if (d.category === undefined && d.cat !== undefined) d.category = d.cat;
  if (d.entityType === undefined && d.type !== undefined) d.entityType = d.type;
  if (d.unit === undefined && d.baseUOM !== undefined) d.unit = d.baseUOM;
  if (d.description === undefined && d.desc !== undefined) d.description = d.desc;
  if (d.defaultWarehouse === undefined && d.wh !== undefined) d.defaultWarehouse = d.wh;
  if (d.defaultBin === undefined && d.locationCode !== undefined) d.defaultBin = d.locationCode;
  if (d.reorderPoint === undefined && d.reorderLevel !== undefined) d.reorderPoint = d.reorderLevel;
  if (d.moldCode === undefined && (d.moldToolId !== undefined || d.machineCompat !== undefined)) {
    d.moldCode = d.moldToolId || d.machineCompat;
  }
  if (d.hsnCode === undefined && d.hsCode !== undefined) d.hsnCode = d.hsCode;
  if (d.cost === undefined && (d.standardCost !== undefined || d.standardPurchasePrice !== undefined)) {
    d.cost = d.standardCost ?? d.standardPurchasePrice;
  }
  if (d.sellingPrice === undefined && (d.standardSalesPrice !== undefined || d.price !== undefined)) {
    d.sellingPrice = d.standardSalesPrice ?? d.price;
  }
  if (d.cycleTime === undefined && d.standardCycleTime !== undefined) d.cycleTime = d.standardCycleTime;
  if (d.cycleTimeSeconds === undefined && (d.standardCycleTime !== undefined || d.cycleTime !== undefined)) {
    d.cycleTimeSeconds = d.standardCycleTime ?? d.cycleTime;
  }
  if (d.imageUrl === undefined && d.itemImage !== undefined) d.imageUrl = d.itemImage;
  if (d.technicalDocUrl === undefined && Array.isArray(d.documents) && d.documents.length > 0) {
    d.technicalDocUrl = d.documents[0]?.url || d.documents[0]?.link || '';
  }

  // Merge extended attributes into metadata JSONB
  const mergedMeta: Record<string, any> = {
    ...(typeof existingMetadata === 'object' && existingMetadata !== null ? existingMetadata : {}),
    ...(typeof d.metadata === 'object' && d.metadata !== null ? d.metadata : {}),
  };

  for (const key of EXTENDED_METADATA_KEYS) {
    if (d[key] !== undefined) {
      mergedMeta[key] = d[key];
    }
  }

  if (Object.keys(mergedMeta).length > 0) {
    d.metadata = mergedMeta;
  }

  return d;
}

function hydrateItemRow(row: any): ItemRow {
  if (!row) return row;
  const meta = (typeof row.metadata === 'object' && row.metadata !== null) ? row.metadata : {};
  return {
    ...meta,
    ...row,
    // Keep metadata.type and metadata.plant accessible at top level
    type: meta.type || row.entityType || 'Finished Good',
    plant: meta.plant || row.plant || 'Plant 1 - Pimpri Auto-Hub',
  } as ItemRow;
}

function sanitize<T extends Record<string, any>>(data: T | undefined): Partial<T> {
  const out: Record<string, any> = {};
  const columns = items as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(data ?? {})) {
    if ((PROTECTED_FIELDS as readonly string[]).includes(k)) continue;
    if (!(k in columns) || v === undefined) continue; // reject unknown fields
    if (NUMERIC_FIELDS.has(k)) {
      if (typeof v === 'number') {
        out[k] = isNaN(v) ? '0' : String(v);
      } else if (typeof v === 'string') {
        const cleaned = v.replace(/[^0-9.-]/g, '');
        out[k] = cleaned && !isNaN(Number(cleaned)) ? cleaned : '0';
      } else {
        out[k] = '0';
      }
      if (k === 'cavityCount') {
        out[k] = Math.max(1, Math.round(Number(out[k])) || 1);
      }
    } else {
      out[k] = typeof v === 'string' ? v.trim() : v;
    }
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
  itemType?: string;
  status?: string;
  approval?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  plantId?: string;
  cursor?: string;
  mode?: 'cursor' | 'offset';
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

const IS_MASTERBATCH = sql`(${items.entityType} = 'Masterbatch' OR ${items.category} = 'Masterbatch')`;
const IS_REGRIND = sql`(NOT ${IS_MASTERBATCH} AND (${items.entityType} = 'Regrind' OR ${items.category} IN ('Regrind', 'Purge & Lumps Recovery')))`;
const IS_RAW_MATERIAL = sql`(NOT ${IS_MASTERBATCH} AND NOT ${IS_REGRIND} AND (${items.entityType} IN ('Raw Material', 'Raw Materials', 'Packaging Material', 'Consumable') OR ${items.category} IN ('Raw Material', 'Raw Materials', 'Virgin Raw Polymer', 'Packaging & Boxes', 'Consumables & Tooling Spares')))`;
const IS_FINISHED_GOOD = sql`(NOT ${IS_MASTERBATCH} AND NOT ${IS_REGRIND} AND NOT ${IS_RAW_MATERIAL})`;

export class DrizzleItemRepository {
  /**
   * Aggregate Metrics: executes a single round-trip query calculating all status metrics
   */
  async getSummary(db: NodePgDatabase<any>, tenantId: string): Promise<ItemSummaryMetrics> {
    const [summary] = await db
      .select({
        total: sql<number>`count(*)::int`,
        finishedGoods: sql<number>`count(*) FILTER (WHERE ${IS_FINISHED_GOOD})::int`,
        rawMaterials: sql<number>`count(*) FILTER (WHERE ${IS_RAW_MATERIAL})::int`,
        masterbatch: sql<number>`count(*) FILTER (WHERE ${IS_MASTERBATCH})::int`,
        regrind: sql<number>`count(*) FILTER (WHERE ${IS_REGRIND})::int`,
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
   * Dual-Engine Item Catalog (Keyset Cursor for infinite virtual streaming + Indexed Offset for compliance page jumping)
   */
  async findPaginated(
    db: NodePgDatabase<any>,
    tenantId: string,
    opts: ItemListOptions = {}
  ): Promise<{ data: ItemRow[]; meta: PaginationMeta }> {
    const isCursorMode = opts.cursor !== undefined || opts.mode === 'cursor';
    const limit = Math.min(100, Math.max(1, Number(opts.limit || 20)));

    const conditions: SQL[] = [
      eq(items.tenantId, tenantId),
      isNull(items.deletedAt),
    ];

    if (opts.plantId) {
      conditions.push(eq(items.plantId, opts.plantId));
    }
    if (opts.category && opts.category !== 'All') {
      conditions.push(eq(items.category, opts.category));
    }
    if (opts.itemType) {
      if (opts.itemType === 'Finished Good') {
        conditions.push(IS_FINISHED_GOOD);
      } else if (opts.itemType === 'Raw Material') {
        conditions.push(IS_RAW_MATERIAL);
      } else if (opts.itemType === 'Masterbatch') {
        conditions.push(IS_MASTERBATCH);
      } else if (opts.itemType === 'Regrind') {
        conditions.push(IS_REGRIND);
      }
    }
    if (opts.status && opts.status !== 'ALL') {
      conditions.push(eq(items.status, opts.status));
    }
    if (opts.approval && opts.approval !== 'ALL') {
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

    // Engine 1: Keyset Cursor Seek (O(1) seek for high-throughput infinite virtualization)
    if (isCursorMode) {
      const cursor = decodeCursor(opts.cursor);
      if (cursor) {
        conditions.push(
          sql`(${items.createdAt}, ${items.id}) < (${cursor.t}::timestamptz, ${cursor.id}::uuid)`
        );
      }

      // Query limit + 1 to detect hasMore in single round-trip without count overhead
      const rows = await db
        .select(ITEM_SELECT_COLUMNS)
        .from(items)
        .where(and(...conditions))
        .orderBy(desc(items.createdAt), desc(items.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const data = (hasMore ? rows.slice(0, limit) : rows).map(hydrateItemRow) as ItemRow[];
      const last = data[data.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeCursor({ t: new Date(last.createdAt).toISOString(), id: last.id })
          : null;

      return {
        data,
        meta: {
          mode: 'cursor',
          limit,
          hasMore,
          nextCursor,
        },
      };
    }

    // Engine 2: Indexed Offset-Limit (Allows arbitrary middle-page jumping, e.g. "Page 47")
    const page = Math.max(1, Number(opts.page || 1));
    const offset = (page - 1) * limit;
    const whereClause = and(...conditions);

    // Count total rows for page calculations
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
      data: rows.map(hydrateItemRow) as ItemRow[],
      meta: {
        mode: 'offset',
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
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

    return row ? hydrateItemRow(row) : null;
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

    return row ? hydrateItemRow(row) : null;
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
    const normalized = normalizeInputWithMetadata(data as any, null);
    const clean = sanitize(normalized);
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

    const hydrated = hydrateItemRow(created);
    try {
      await db.insert(auditLogs).values({
        tenantId,
        entityType: 'items',
        entityId: created.code || created.id,
        action: 'CREATE',
        changedFields: Object.keys(clean),
        oldValues: null,
        newValues: hydrated as any,
        performedBy: actorId,
      });
    } catch (_) {}

    return hydrated;
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
    const existing = await this.findById(db, tenantId, id);
    const normalized = normalizeInputWithMetadata(data as any, (existing as any)?.metadata);
    const clean = sanitize(normalized);
    const [updated] = await db
      .update(items)
      .set({
        ...clean,
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

    if (!updated) return null;
    const hydrated = hydrateItemRow(updated);
    try {
      const action =
        (data as any)?.approval === 'approved' && existing?.approval !== 'approved'
          ? 'APPROVE'
          : (data as any)?.approval === 'rejected' && existing?.approval !== 'rejected'
          ? 'REJECT'
          : 'UPDATE';
      const changedFields = Object.keys(clean).filter(
        (k) => JSON.stringify((existing as any)?.[k]) !== JSON.stringify((updated as any)?.[k])
      );
      await db.insert(auditLogs).values({
        tenantId,
        entityType: 'items',
        entityId: updated.code || updated.id,
        action,
        changedFields: changedFields.length ? changedFields : Object.keys(clean),
        oldValues: (existing as any) ?? null,
        newValues: hydrated as any,
        performedBy: actorId,
      });
    } catch (_) {}

    return hydrated;
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
    const existing = await this.findById(db, tenantId, id);
    const [deleted] = await db
      .update(items)
      .set({
        deletedAt: new Date(),
        updatedBy: actorId,
      })
      .where(and(eq(items.tenantId, tenantId), eq(items.id, id), isNull(items.deletedAt)))
      .returning({ id: items.id, code: items.code });

    if (deleted) {
      try {
        await db.insert(auditLogs).values({
          tenantId,
          entityType: 'items',
          entityId: deleted.code || deleted.id,
          action: 'DELETE',
          changedFields: ['deletedAt'],
          oldValues: (existing as any) ?? null,
          newValues: { deletedAt: new Date().toISOString() },
          performedBy: actorId,
        });
      } catch (_) {}
    }

    return Boolean(deleted);
  }
}

export const itemRepository = new DrizzleItemRepository();
