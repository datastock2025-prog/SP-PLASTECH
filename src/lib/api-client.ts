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

export const ItemMasterSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Item Code is required'),
  name: z.string().min(1, 'Item Name is required'),
  category: z.string().optional().default('Finished Good'),
  cat: z.string().optional(),
  type: z.string().default('Finished Good'),
  stock: z.union([z.string(), z.number()]).default('0'),
  avail: z.union([z.string(), z.number()]).default('0'),
  wh: z.string().default('FG_WH_A'),
  plant: z.string().optional().default('Plant 1 - Pimpri Auto-Hub'),
  lot: z.boolean().default(true),
  qc: z.boolean().default(true),
  status: z.string().default('active'),
  baseUOM: z.string().default('PCS'),
  base_uom: z.string().optional(),
  desc: z.string().optional().default(''),
  icon: z.string().optional().default('◇'),
  approval: z.string().optional().default('approved'),
  approval_status: z.string().optional(),
  cost: z.number().optional().default(0),
  standardCost: z.number().optional().default(0),
  standard_cost: z.number().optional(),
  sellingPrice: z.number().optional().default(0),
  minStock: z.number().optional().default(100),
  maxStock: z.number().optional().default(5000),
  reorderPoint: z.number().optional().default(500),
  reorderLevel: z.union([z.string(), z.number()]).optional(),
  reorder_level: z.union([z.string(), z.number()]).optional(),
  safetyStock: z.union([z.string(), z.number()]).optional(),
  safety_stock: z.union([z.string(), z.number()]).optional(),
  leadTime: z.string().optional(),
  lead_time: z.string().optional(),
  supplier: z.string().optional(),
  cavityCount: z.number().optional().default(1),
  cavity_count: z.number().optional(),
  cycleTimeSec: z.number().optional().default(0),
  cycle_time: z.number().optional(),
  standardCycleTime: z.number().optional(),
  partWeightGrams: z.number().optional(),
  part_weight_grams: z.number().optional(),
  runnerWeightGrams: z.number().optional(),
  runner_weight_grams: z.number().optional(),
  shotWeightGrams: z.number().optional(),
  shot_weight_grams: z.number().optional(),
  resinType: z.string().optional(),
  resin_type: z.string().optional(),
  createdOn: z.string().optional(),
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

export const itemEndpoints = {
  /**
   * Rule 2: Strict Paginated Item Catalog Retrieval
   * Queries Supabase PostgreSQL with .range(from, to)
   */
  async getItemsPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<PaginatedItemsResponse> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
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
    const normalizedItems = rawList.map((row: any) => ({
      id: String(row.id || row.code),
      code: String(row.code || ''),
      name: String(row.name || ''),
      category: String(row.category || 'Raw Material'),
      type: String(row.entity_type || row.type || 'Raw Material'),
      stock: row.stock ?? 0,
      avail: row.avail ?? row.stock ?? 0,
      wh: String(row.wh || 'RM-WH-01'),
      lot: Boolean(row.lot ?? true),
      qc: Boolean(row.qc ?? true),
      status: String(row.status || 'active'),
      baseUOM: String(row.unit || row.baseUOM || 'KG'),
      desc: String(row.description || row.desc || ''),
      icon: String(row.icon || '◇'),
      approval: String(row.approval || 'approved'),
      cost: Number(row.cost || 0),
      sellingPrice: Number(row.selling_price || row.sellingPrice || 0),
      minStock: Number(row.min_stock || 100),
      maxStock: Number(row.max_stock || 5000),
      reorderPoint: Number(row.reorder_point || 500),
      cavityCount: Number(row.cavity_count || 1),
      cycleTimeSec: Number(row.cycle_time || 0),
      createdOn: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));

    // Zod validation on all items
    const parsedItems = z.array(ItemMasterSchema).parse(normalizedItems);
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
   * Save or Update Item Record with Zod Validation
   */
  async saveItem(item: ItemMasterDto): Promise<ItemMasterDto> {
    const validated = ItemMasterSchema.parse(item);

    const dbPayload = {
      code: validated.code,
      name: validated.name,
      category: validated.category,
      entity_type: validated.type,
      unit: validated.baseUOM,
      stock: typeof validated.stock === 'number' ? validated.stock : parseFloat(String(validated.stock)) || 0,
      cost: validated.cost || 0,
      selling_price: validated.sellingPrice || 0,
      status: validated.status || 'active',
      approval: validated.approval || 'approved',
      min_stock: validated.minStock || 100,
      max_stock: validated.maxStock || 5000,
      reorder_point: validated.reorderPoint || 500,
      cavity_count: validated.cavityCount || 1,
      cycle_time: validated.cycleTimeSec || 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('items')
      .upsert(dbPayload, { onConflict: 'code' })
      .select()
      .single();

    if (error) {
      console.warn('[itemEndpoints.saveItem] Database notice:', error.message);
    }

    return validated;
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
        validItems.push({
          code: validated.code,
          name: validated.name,
          category: validated.category,
          entity_type: validated.type,
          unit: validated.baseUOM,
          stock: typeof validated.stock === 'number' ? validated.stock : parseFloat(String(validated.stock)) || 0,
          cost: validated.cost || 0,
          selling_price: validated.sellingPrice || 0,
          status: validated.status || 'active',
          approval: validated.approval || 'approved',
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
