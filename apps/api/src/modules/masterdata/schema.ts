import { z } from 'zod';

export const CreateItemInputSchema = z.object({
  code: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(255),
  category: z.string().trim().min(1),
  type: z.string().trim().default('Finished Good'),
  uom: z.string().trim().min(1),
  costPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().min(0).default(5000),
  reorderPoint: z.number().min(0).default(0),
  safetyStock: z.number().min(0).default(0),
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
});

export const UpdateItemInputSchema = CreateItemInputSchema.partial().extend({
  version: z.number().int().min(0),
});
