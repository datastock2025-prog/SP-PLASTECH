import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { items } from '../schema/erp.js';

/**
 * Normalizes input keys: converts camelCase to database snake_case and bridges legacy UI aliases
 */
export function normalizeItemContractInput(val: any): any {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return val;
  const out: Record<string, any> = {};

  for (const [k, v] of Object.entries(val)) {
    const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    out[snake] = v;
  }

  // Map legacy shorthand field aliases
  if (out.type && !out.entity_type) out.entity_type = out.type;
  if (out.cat && !out.category) out.category = out.cat;
  if (out.base_u_o_m && !out.unit) out.unit = out.base_u_o_m;
  if (out.base_uom && !out.unit) out.unit = out.base_uom;
  if (out.wh && !out.default_warehouse) out.default_warehouse = out.wh;
  if (out.cost_price !== undefined && out.cost === undefined) out.cost = out.cost_price;
  if (out.reorder_level !== undefined && out.reorder_point === undefined) out.reorder_point = out.reorder_level;
  if (out.standard_cycle_time !== undefined && out.cycle_time_seconds === undefined) out.cycle_time_seconds = out.standard_cycle_time;
  if (out.mold_tool_id && !out.mold_code) out.mold_code = out.mold_tool_id;

  // Strip transient non-column fields
  delete out.type;
  delete out.cat;
  delete out.wh;
  delete out.base_u_o_m;
  delete out.base_uom;
  delete out.cost_price;
  delete out.reorder_level;
  delete out.standard_cycle_time;
  delete out.mold_tool_id;
  delete out.is_edit;
  delete out.is_batch_tracked;

  return out;
}

// 1. Authoritative Drizzle-Zod Select Contract
export const itemSelectSchema = createSelectSchema(items);

// 2. Strict Database Schema Contract
const numStr = z.union([z.number(), z.string()]).transform((v) => String(v));

export const rawItemInsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).default('Finished Good'),
  entity_type: z.string().trim().optional().default('Finished Molded Component'),
  unit: z.string().trim().optional().default('NOS'),
  stock: numStr.optional().default('0'),
  min_stock: numStr.optional().default('0'),
  max_stock: numStr.optional().default('5000'),
  reorder_point: numStr.optional().default('0'),
  cost: numStr.optional().default('0'),
  selling_price: numStr.optional().default('0'),
  approval: z.string().trim().optional().default('draft'),
  status: z.string().trim().optional().default('active'),
  part_weight_grams: numStr.optional().default('0'),
  runner_weight_grams: numStr.optional().default('0'),
  cavity_count: z.coerce.number().int().optional().default(1),
  cycle_time: numStr.optional().default('0'),
  cycle_time_seconds: numStr.optional().default('0'),
  mold_code: z.string().trim().optional().nullable(),
  safety_stock: numStr.optional().default('0'),
  valuation_method: z.string().trim().optional().default('FIFO'),
  description: z.string().trim().optional().nullable(),
  item_group: z.string().trim().optional().nullable(),
  resin_type: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  hsn_code: z.string().trim().optional().nullable(),
  supplier: z.string().trim().optional().nullable(),
  lead_time: z.string().trim().optional().nullable(),
  routing_destination: z.string().trim().optional().nullable().default('WIP'),
  plant_id: z.string().uuid().optional().nullable(),
  image_url: z.string().trim().optional().nullable(),
  technical_doc_url: z.string().trim().optional().nullable(),
  processing_method: z.string().trim().optional().nullable(),
  default_warehouse: z.string().trim().optional().nullable(),
  default_bin: z.string().trim().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
}).strict();

// 3. Preprocessed Insert & Update Schemas
export const itemInsertSchema = z.preprocess((val: any) => {
  const norm = normalizeItemContractInput(val);
  if (norm && typeof norm === 'object') {
    delete norm.version;
  }
  return norm;
}, rawItemInsertSchema);

export const itemUpdateSchema = z.preprocess(
  normalizeItemContractInput,
  rawItemInsertSchema.partial().extend({
    version: z.coerce.number().int().min(1),
  }).strict()
);

export type Item = z.infer<typeof itemSelectSchema>;
export type ItemInsertInput = z.infer<typeof rawItemInsertSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
