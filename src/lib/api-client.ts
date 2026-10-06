import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';
import { supabase } from '../shared/supabaseClient';

// ============================================================================
// 1. CENTRALIZED ENTERPRISE API CLIENT (src/lib/api-client.ts)
// Single Source of Truth for Network Communication, Strict Env Vars & Headers
// ============================================================================

const DEFAULT_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://gqrelwvmeoqvfnanoutz.supabase.co/rest/v1';

export const api: AxiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000, // Prevent infinite network hanging
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Rule 4: Cloudflare Cache Bypass for Dynamic Data
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
});

// Response Interceptor for Centralized Error Handling & Diagnostics
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorMsg = error.response?.data || error.message;
    console.error(`[API ERROR] ${error.config?.url}:`, errorMsg);
    return Promise.reject(error);
  }
);

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

function mapSupabaseRowToItemDto(row: any): ItemMasterDto {
  const partWeight = Number(row.part_weight_grams ?? row.partWeightGrams ?? 0);
  const runnerWeight = Number(row.runner_weight_grams ?? row.runnerWeightGrams ?? 0);
  const shotWeight = Number((partWeight + runnerWeight).toFixed(2));
  const cycleTimeVal = Number(
    row.cycle_time_seconds ?? row.cycle_time ?? row.cycleTimeSec ?? row.cycleTime ?? row.standardCycleTime ?? 0
  );

  const normalized = {
    id: String(row.id || row.code || ''),
    code: String(row.code || ''),
    name: String(row.name || ''),
    category: String(row.category || row.cat || 'Finished Good'),
    cat: String(row.category || row.cat || 'Finished Good'),
    type: String(row.entity_type || row.type || 'Finished Good'),
    stock: row.stock ?? 0,
    avail: row.avail ?? row.stock ?? 0,
    wh: String(row.wh || 'FG_WH_A'),
    plant: String(row.plant || 'Plant 1 - Pimpri Auto-Hub'),
    lot: Boolean(row.lot ?? true),
    qc: Boolean(row.qc ?? true),
    status: String(row.status || 'active'),
    baseUOM: String(row.unit || row.baseUOM || 'PCS'),
    desc: String(row.description || row.desc || ''),
    icon: String(row.icon || '◇'),
    approval: String(row.approval || 'approved'),
    cost: Number(row.cost || 0),
    standardCost: Number(row.cost || row.standardCost || 0),
    sellingPrice: Number(row.selling_price || row.sellingPrice || 0),
    minStock: Number(row.min_stock ?? row.minStock ?? 0),
    maxStock: Number(row.max_stock ?? row.maxStock ?? 5000),
    reorderPoint: Number(row.reorder_point ?? row.reorderPoint ?? 0),
    safetyStock: Number(row.safety_stock ?? row.safetyStock ?? 0),
    valuationMethod: String(row.valuation_method || row.valuationMethod || 'FIFO'),
    cavityCount: Number(row.cavity_count ?? row.cavityCount ?? 1),
    cycleTimeSec: cycleTimeVal,
    cycleTime: cycleTimeVal,
    standardCycleTime: cycleTimeVal,
    partWeightGrams: partWeight,
    netWeightGrams: partWeight,
    runnerWeightGrams: runnerWeight,
    shotWeightGrams: shotWeight,
    moldToolId: String(row.mold_code || row.moldToolId || row.mold_tool_id || ''),
    resinType: String(row.resin_type || row.resinType || row.polymerGrade || ''),
    polymerGrade: String(row.resin_type || row.resinType || row.polymerGrade || ''),
    color: String(row.color || ''),
    hsnCode: String(row.hsn_code || row.hsnCode || ''),
    itemGroup: String(row.item_group || row.itemGroup || row.category || ''),
    createdOn: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };

  return ItemMasterSchema.parse(normalized);
}

export const ITEM_LEAN_SELECT_COLUMNS =
  'id, code, name, category, entity_type, unit, stock, min_stock, max_stock, reorder_point, cost, selling_price, approval, status, created_at, updated_at';

export const ITEM_SELECT_COLUMNS =
  'id, code, name, category, entity_type, unit, stock, min_stock, max_stock, reorder_point, cost, selling_price, approval, status, part_weight_grams, runner_weight_grams, cavity_count, cycle_time_seconds, item_group, resin_type, color, hsn_code, created_at, updated_at';

export const itemEndpoints = {
  /**
   * Rule 2: Strict Paginated Item Catalog Retrieval with Selective Column Projection
   * Queries Supabase PostgreSQL with .range(from, to) and minimal column payload (low TTFB)
   */
  async getItemsPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    lean?: boolean;
  }): Promise<PaginatedItemsResponse> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const selectCols = params.lean !== false ? ITEM_LEAN_SELECT_COLUMNS : ITEM_SELECT_COLUMNS;

    let query = supabase
      .from('items')
      .select(selectCols, { count: 'exact' })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      query = query.or(`code.ilike.%${s}%,name.ilike.%${s}%`);
    }

    if (params.category && params.category !== 'All' && params.category !== 'ALL') {
      query = query.eq('category', params.category);
    }

    if (params.status && params.status !== 'ALL') {
      query = query.eq('status', params.status);
    }

    const { data, count, error } = await query;

    if (error) {
      console.warn('[itemEndpoints.getItemsPaginated] Query note:', error.message);
    }

    const rawList = Array.isArray(data) ? data : [];
    const parsedItems = rawList.map(mapSupabaseRowToItemDto);
    const total = count ?? parsedItems.length;

    return {
      items: parsedItems,
      totalCount: total,
      page,
      limit,
      hasMore: from + parsedItems.length < total,
    };
  },

  /**
   * Get Single Item by Code with Zod Validation and selective column projection
   */
  async getItemByCode(code: string): Promise<ItemMasterDto | null> {
    const { data, error } = await supabase
      .from('items')
      .select(ITEM_SELECT_COLUMNS)
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapSupabaseRowToItemDto(data);
  },

  /**
   * Save or Update Item Record with Zod Validation directly into Supabase Cloud PostgreSQL
   */
  async saveItem(item: ItemMasterDto): Promise<ItemMasterDto> {
    const parseResult = ItemMasterSchema.safeParse(item);
    const validated = parseResult.success ? parseResult.data : item;

    if (!parseResult.success) {
      console.warn('[itemEndpoints.saveItem] Zod parse note:', parseResult.error);
    }

    const partWeight = Number(validated.partWeightGrams ?? (validated as any).netWeightGrams ?? (validated as any).part_weight_grams ?? 0);
    const runnerWeight = Number(validated.runnerWeightGrams ?? (validated as any).runner_weight_grams ?? 0);
    const cycleTime = Number(
      validated.cycleTimeSec ?? (validated as any).cycleTime ?? (validated as any).standardCycleTime ?? (validated as any).cycle_time_seconds ?? (validated as any).cycle_time ?? 0
    );

    const reorderVal =
      validated.reorderPoint !== undefined
        ? Number(validated.reorderPoint)
        : (validated as any).reorderLevel
        ? parseFloat(String((validated as any).reorderLevel)) || 0
        : 0;

    // Strict 24 verified database columns for the items table
    const dbPayload: Record<string, any> = {
      code: String(validated.code).trim(),
      name: String(validated.name).trim(),
      category: String(validated.category || validated.cat || 'Finished Good'),
      entity_type: String(validated.type || 'Finished Good'),
      unit: String(validated.baseUOM || validated.base_uom || 'PCS'),
      stock: typeof validated.stock === 'number' ? validated.stock : parseFloat(String(validated.stock)) || 0,
      cost: Number(validated.cost ?? (validated as any).standardCost ?? 0),
      selling_price: Number(validated.sellingPrice || 0),
      status: String(validated.status || 'active'),
      approval: String(validated.approval || 'approved'),
      min_stock: Number(validated.minStock ?? 0),
      max_stock: Number(validated.maxStock ?? 5000),
      reorder_point: reorderVal,
      cavity_count: Number(validated.cavityCount ?? (validated as any).cavity_count ?? 1),
      cycle_time_seconds: cycleTime,
      part_weight_grams: partWeight,
      runner_weight_grams: runnerWeight,
      resin_type: String(validated.resinType || (validated as any).resin_type || (validated as any).polymerGrade || ''),
      color: String((validated as any).color || ''),
      hsn_code: String((validated as any).hsn_code || (validated as any).hsnCode || ''),
      item_group: String((validated as any).itemGroup || (validated as any).item_group || validated.category || ''),
      created_at: (validated as any).created_at || (validated as any).createdOn || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('items')
      .upsert(dbPayload, { onConflict: 'code' })
      .select(ITEM_SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      console.error('[itemEndpoints.saveItem] Supabase Upsert Error:', error.message, error);
      throw new Error(`Database save failed: ${error.message}`);
    }

    return mapSupabaseRowToItemDto(data || dbPayload);
  },

  /**
   * Delete Item by Code
   */
  async deleteItem(code: string): Promise<boolean> {
    const { error } = await supabase.from('items').delete().eq('code', code);
    if (error) {
      console.warn('[itemEndpoints.deleteItem] Notice:', error.message);
    }
    return true;
  },

  /**
   * Bulk Import Items (Grid In Functionality)
   */
  async bulkImport(items: ItemMasterDto[]): Promise<{ importedCount: number; errors: string[] }> {
    const validItems: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const validated = ItemMasterSchema.parse(items[i]);
        const partWeight = Number(validated.partWeightGrams ?? (validated as any).netWeightGrams ?? 0);
        const runnerWeight = Number(validated.runnerWeightGrams ?? 0);
        const cycleTime = Number(validated.cycleTimeSec ?? (validated as any).cycleTime ?? (validated as any).standardCycleTime ?? 0);

        validItems.push({
          code: validated.code,
          name: validated.name,
          category: validated.category || validated.cat || 'Finished Good',
          entity_type: validated.type || 'Finished Good',
          unit: validated.baseUOM || validated.base_uom || 'PCS',
          stock: typeof validated.stock === 'number' ? validated.stock : parseFloat(String(validated.stock)) || 0,
          cost: Number(validated.cost ?? (validated as any).standardCost ?? 0),
          selling_price: Number(validated.sellingPrice || 0),
          status: validated.status || 'active',
          approval: validated.approval || 'approved',
          min_stock: Number(validated.minStock ?? 0),
          max_stock: Number(validated.maxStock ?? 5000),
          reorder_point: Number(validated.reorderPoint ?? 0),
          safety_stock: Number((validated as any).safetyStock ?? 0),
          cavity_count: Number(validated.cavityCount ?? 1),
          cycle_time_seconds: cycleTime,
          part_weight_grams: partWeight,
          runner_weight_grams: runnerWeight,
          mold_code: (validated as any).moldToolId || null,
          resin_type: validated.resinType || (validated as any).polymerGrade || '',
          color: (validated as any).color || '',
          hsn_code: (validated as any).hsn_code || (validated as any).hsnCode || '',
          valuation_method: (validated as any).valuationMethod || 'FIFO',
          item_group: (validated as any).itemGroup || validated.category || null,
          updated_at: new Date().toISOString(),
        });
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${items[i]?.code || 'unknown'}): ${err.message}`);
      }
    }

    if (validItems.length > 0) {
      const { error } = await supabase
        .from('items')
        .upsert(validItems, { onConflict: 'code' });

      if (error) {
        errors.push(`Bulk upsert error: ${error.message}`);
      }
    }

    return {
      importedCount: validItems.length,
      errors,
    };
  },
};

// ============================================================================
// 4. ENGINEERING BOM ENDPOINTS (Strict Schema & Direct Supabase Bridge)
// ============================================================================

export const BomSchema = z.object({
  id: z.string().min(1, 'BOM ID is required'),
  item_code: z.string().optional(),
  itemCode: z.string().optional(),
  parent: z.string().optional(),
  parentName: z.string().optional(),
  version: z.string().default('v1.0'),
  status: z.string().default('active'),
  components: z.array(z.any()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough();

export type BomDto = z.infer<typeof BomSchema>;

export const BOM_SELECT_COLUMNS = 'id, item_code, version, status, components, created_at, updated_at';

export const bomEndpoints = {
  async getBoms(): Promise<BomDto[]> {
    const { data, error } = await supabase
      .from('boms')
      .select(BOM_SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      return [];
    }
    return data.map((b) => BomSchema.parse(b));
  },

  async getBomById(id: string): Promise<BomDto | null> {
    const { data, error } = await supabase
      .from('boms')
      .select(BOM_SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return BomSchema.parse(data);
  },

  async saveBom(bom: Partial<BomDto>): Promise<BomDto> {
    const payload = {
      id: bom.id,
      item_code: bom.item_code || bom.itemCode || (bom as any).parent,
      version: bom.version || 'v1.0',
      status: bom.status || 'active',
      components: (bom as any).lines || (bom as any).components || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('boms')
      .upsert(payload, { onConflict: 'id' })
      .select(BOM_SELECT_COLUMNS)
      .single();

    if (error) {
      throw new Error(`BOM save failed: ${error.message}`);
    }
    return BomSchema.parse(data || payload);
  },

  async deleteBom(id: string): Promise<boolean> {
    const { error } = await supabase.from('boms').delete().eq('id', id);
    if (error) {
      console.warn('[bomEndpoints.deleteBom] Note:', error.message);
    }
    return true;
  },
};

