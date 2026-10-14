import { z } from 'zod';
import { ItemMaster, ItemCategoryNode } from '../../../types';

export const createItemSchema = z.object({
  code: z
    .string()
    .min(2, 'Item code must be at least 2 characters')
    .max(100)
    .regex(/^[A-Za-z0-9_.-]+$/, 'Code can only contain alphanumeric characters, hyphens, and dots')
    .trim(),
  name: z.string().min(2, 'Item name must be at least 2 characters').max(255).trim(),
  category: z.string().min(1, 'Category is required'),
  type: z.string().default('Finished Good'),
  uom: z.string().min(1, 'Unit of Measure is required').trim(),
  costPrice: z.number().min(0, 'Cost price cannot be negative').default(0),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative').default(0),
  minStock: z.number().min(0, 'Min stock cannot be negative').default(0),
  maxStock: z.number().min(0, 'Max stock cannot be negative').default(5000),
  reorderPoint: z.number().min(0, 'Reorder point cannot be negative').default(0),
  safetyStock: z.number().min(0, 'Safety stock cannot be negative').default(0),
  location: z.string().optional(),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  isBatchTracked: z.boolean().default(true),
  partWeightGrams: z.number().min(0).default(0),
  runnerWeightGrams: z.number().min(0).default(0),
  cavityCount: z.number().int().min(1).default(1),
  cycleTimeSeconds: z.number().min(0).default(0),
  moldCode: z.string().optional(),
  resinType: z.string().optional(),
  color: z.string().optional(),
  version: z.number().int().optional().default(1),
});

export const updateItemSchema = createItemSchema.partial().extend({
  version: z.number().int(),
});

export type CreateItemFormValues = z.infer<typeof createItemSchema>;
export type UpdateItemFormValues = z.infer<typeof updateItemSchema>;

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export type { ItemMaster, ItemCategoryNode };
