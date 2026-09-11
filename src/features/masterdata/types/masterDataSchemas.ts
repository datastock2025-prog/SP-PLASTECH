import { z } from 'zod';
import { ItemMaster, ItemCategoryNode } from '../../../types';

export const createItemSchema = z.object({
  code: z.string().min(3, 'Item code must be at least 3 characters').regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric characters and hyphens only'),
  name: z.string().min(3, 'Item name must be at least 3 characters'),
  category: z.enum(['raw_material', 'wip', 'finished_good', 'packaging', 'maint_spare', 'trading', 'scrap', 'subcontract']),
  uom: z.string().min(1, 'Unit of Measure is required'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  minStock: z.number().min(0, 'Min stock cannot be negative'),
  maxStock: z.number().min(0, 'Max stock cannot be negative'),
  reorderPoint: z.number().min(0, 'Reorder point cannot be negative'),
  location: z.string().min(1, 'Default storage bin/rack location is required'),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  isBatchTracked: z.boolean().default(true),
});

export type CreateItemFormValues = z.infer<typeof createItemSchema>;

export type { ItemMaster, ItemCategoryNode };
