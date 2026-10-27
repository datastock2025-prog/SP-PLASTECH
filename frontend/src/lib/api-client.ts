import { z } from 'zod';
import { createHttpClient, type HttpClient } from '../shared/api/http';

// ============================================================================
// 1. CENTRALIZED ENTERPRISE API CLIENT (src/lib/api-client.ts)
// Single Source of Truth for Network Communication, Strict Env Vars & Headers
// ============================================================================

const DEFAULT_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  '/api/v1';

export const api: HttpClient = createHttpClient(DEFAULT_BASE_URL);

// ============================================================================
// 2. ZOD VALIDATION SCHEMAS (Runtime Schema Integrity)
// ============================================================================

const numericField = (def: number = 0) =>
  z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return def;
    const num = Number(val);
    return isNaN(num) ? def : num;
  }, z.number().default(def));

const stringField = (def: string = '') =>
  z.preprocess((val) => {
    if (val === null || val === undefined) return def;
    return String(val);
  }, z.string().default(def));

const booleanField = (def: boolean = true) =>
  z.preprocess((val) => {
    if (val === null || val === undefined) return def;
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === '1' || val === 1) return true;
    if (val === 'false' || val === '0' || val === 0) return false;
    return Boolean(val);
  }, z.boolean().default(def));

export const ItemMasterSchema = z.object({
  id: stringField(),
  code: z.string().min(1, 'Item Code is required'),
  name: z.string().min(1, 'Item Name is required'),
  category: stringField('Finished Good'),
  cat: stringField(),
  type: stringField('Finished Good'),
  stock: z.union([z.string(), z.number()]).default('0'),
  avail: z.union([z.string(), z.number()]).default('0'),
  wh: stringField('FG_WH_A'),
  plant: stringField('Plant 1 - Pimpri Auto-Hub'),
  lot: booleanField(true),
  qc: booleanField(true),
  status: stringField('active'),
  baseUOM: stringField('PCS'),
  base_uom: stringField(),
  desc: stringField(''),
  icon: stringField('◇'),
  approval: stringField('approved'),
  approval_status: stringField(),
  cost: numericField(0),
  standardCost: numericField(0),
  standard_cost: numericField(),
  sellingPrice: numericField(0),
  minStock: numericField(100),
  maxStock: numericField(5000),
  reorderPoint: numericField(500),
  reorderLevel: z.union([z.string(), z.number()]).optional(),
  reorder_level: z.union([z.string(), z.number()]).optional(),
  safetyStock: z.union([z.string(), z.number()]).optional(),
  safety_stock: z.union([z.string(), z.number()]).optional(),
  valuationMethod: stringField('FIFO'),
  valuation_method: stringField(),
  leadTime: stringField(),
  lead_time: stringField(),
  supplier: stringField(),
  cavityCount: numericField(1),
  cavity_count: numericField(),
  cycleTimeSec: numericField(0),
  cycleTime: numericField(),
  cycle_time: numericField(),
  cycle_time_seconds: numericField(),
  standardCycleTime: numericField(),
  partWeightGrams: numericField(),
  part_weight_grams: numericField(),
  netWeightGrams: numericField(),
  runnerWeightGrams: numericField(),
  runner_weight_grams: numericField(),
  shotWeightGrams: numericField(),
  shot_weight_grams: numericField(),
  moldToolId: stringField(),
  mold_tool_id: stringField(),
  mold_code: stringField(),
  resinType: stringField(),
  resin_type: stringField(),
  polymerGrade: stringField(),
  color: stringField(),
  hsnCode: stringField(),
  hsn_code: stringField(),
  itemGroup: stringField(),
  item_group: stringField(),
  imageUrl: stringField(),
  image_url: stringField(),
  technicalDocUrl: stringField(),
  technical_doc_url: stringField(),
  processingMethod: stringField(),
  processing_method: stringField(),
  defaultWarehouse: stringField(),
  default_warehouse: stringField(),
  defaultBin: stringField(),
  default_bin: stringField(),
  createdOn: stringField(),
}).passthrough();

export type ItemMasterDto = z.infer<typeof ItemMasterSchema>;

export const PaginatedItemsResponseSchema = z.object({
  items: z.array(ItemMasterSchema),
  totalCount: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

export type PaginatedItemsResponse = z.infer<typeof PaginatedItemsResponseSchema>;

// ============================================================================
// 3. TYPED DATA ENDPOINTS (Provider-Agnostic with Direct Database Bridge)
// ============================================================================

export const ITEM_LEAN_SELECT_COLUMNS =
  'id, code, name, category, entity_type, unit, stock, min_stock, max_stock, reorder_point, cost, selling_price, approval, status, created_at, updated_at';

// ============================================================================
// 4. ENGINEERING BOM ENDPOINTS (Strict Schema & Direct PostgreSQL Bridge)
// ============================================================================

export const BomSchema = z.object({
  id: stringField(),
  item_code: stringField(),
  itemCode: stringField(),
  parent: stringField(),
  parentName: stringField(),
  version: z.union([z.string(), z.number()]).transform((v) => String(v || '1.0')).default('1.0'),
  status: stringField('draft'),
  components: z.array(z.any()).default([]),
  lines: z.array(z.any()).default([]),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
}).passthrough();

export type BomDto = z.infer<typeof BomSchema>;

export const BOM_SELECT_COLUMNS = 'id, item_code, bom_version, version, status, lines, created_at, updated_at';

function unpackBomRow(row: any): BomDto {
  const rawLines = Array.isArray(row.lines)
    ? row.lines
    : Array.isArray(row.components)
      ? row.components
      : [];
  const meta =
    rawLines.find((l: any) => l && typeof l === 'object' && l._bomMeta)?._bomMeta ||
    row._bomMeta ||
    {};
  const cleanLines = rawLines
    .filter((l: any) => !(l && l._bomMetaOnly))
    .map((l: any) => {
      if (!l || typeof l !== 'object') return l;
      const { _bomMeta, ...rest } = l;
      return rest;
    });

  return BomSchema.parse({
    ...meta,
    ...row,
    item_code: row.item_code || row.itemCode || meta.parent || '',
    parent: row.item_code || row.itemCode || meta.parent || '',
    parentName: meta.parentName || meta.bomName || row.parentName || row.item_code || '',
    version: row.bom_version || meta.bomVersion || (typeof row.version === 'string' ? row.version : `${row.version || '1.0'}`),
    status: row.status || meta.status || 'draft',
    lines: cleanLines,
    components: cleanLines,
  });
}

export const bomEndpoints = {
  async getBoms(): Promise<BomDto[]> {
    try {
      const res = await api.get<any>('/bill-of-materials', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc' },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(unpackBomRow);
      }
    } catch (e) {
      console.warn('[bomEndpoints.getBoms] Direct REST note:', e);
    }
    return [];
  },

  async getBomById(id: string): Promise<BomDto | null> {
    try {
      const res = await api.get<any>(`/bill-of-materials/${encodeURIComponent(id)}`);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object' && row.id) {
        return unpackBomRow(row);
      }
    } catch (e: any) {
      if (e?.status === 404 || e?.code === 'NOT_FOUND') return null;
      console.warn('[bomEndpoints.getBomById] Direct REST note:', e);
    }
    return null;
  },

  async saveBom(bom: Partial<BomDto>): Promise<BomDto> {
    const b: any = bom;
    const payload: Record<string, any> = {
      ...b,
      id: b.id,
      item_code: b.item_code || b.itemCode || b.parent,
      bom_version: b.bom_version || b.bomVersion || b.version || '1.0',
      status: b.status || 'draft',
      lines: b.lines || b.components || [],
    };

    if (b.id) {
      try {
        const res = await api.patch<any>(`/bill-of-materials/${encodeURIComponent(b.id)}`, payload);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') {
          return unpackBomRow(row);
        }
      } catch (patchErr: any) {
        if (patchErr?.status === 404 || patchErr?.code === 'NOT_FOUND') {
          const postRes = await api.post<any>('/bill-of-materials', payload);
          const postRow = postRes?.data?.data || postRes?.data;
          if (postRow && typeof postRow === 'object') {
            return unpackBomRow(postRow);
          }
        }
      }
    } else {
      const postRes = await api.post<any>('/bill-of-materials', payload);
      const postRow = postRes?.data?.data || postRes?.data;
      if (postRow && typeof postRow === 'object') {
        return unpackBomRow(postRow);
      }
    }

    return unpackBomRow({
      ...payload,
      id: b.id || `BOM-${Date.now()}`,
    });
  },

  async deleteBom(id: string): Promise<boolean> {
    try {
      await api.delete(`/bill-of-materials/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },

  async explodeBom(id: string, qty: number = 1): Promise<any> {
    const res = await api.get<any>(`/bill-of-materials/${id}/explode?qty=${qty}`);
    return res?.data?.data || res?.data || res;
  },

  async releaseBom(id: string): Promise<any> {
    const res = await api.post<any>(`/bill-of-materials/${id}/release`, {});
    return res?.data?.data || res?.data || res;
  },

  async getBomLines(bomId: string): Promise<any[]> {
    try {
      const res = await api.get<any>('/bom-lines', {
        params: { 'where[bom_id]': bomId, limit: 100, sortBy: 'line_no', sortOrder: 'asc' },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },

  async saveBomLine(line: Record<string, any>): Promise<any> {
    if (line.id) {
      try {
        const res = await api.patch<any>(`/bom-lines/${encodeURIComponent(line.id)}`, line);
        const row = res?.data?.data || res?.data;
        if (row) return row;
      } catch {}
    }
    const res = await api.post<any>('/bom-lines', line);
    return res?.data?.data || res?.data || line;
  },

  async deleteBomLine(id: string): Promise<boolean> {
    try {
      await api.delete(`/bom-lines/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },
};
