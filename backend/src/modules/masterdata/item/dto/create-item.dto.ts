import { z } from 'zod';

export const CreateItemDtoSchema = z.object({
  code: z.string().min(1, 'Item Code is required').max(100).trim(),
  name: z.string().min(1, 'Item Name is required').max(255).trim(),
  category: z.string().default('Finished Good'),
  entityType: z.string().default('Finished Molded Component'),
  unit: z.string().trim().default('PCS'),
  stock: z.number().nonnegative('Stock cannot be negative').default(0),
  minStock: z.number().nonnegative('Min stock cannot be negative').default(0),
  maxStock: z.number().nonnegative('Max stock cannot be negative').default(5000),
  reorderPoint: z.number().nonnegative().default(0),
  safetyStock: z.number().nonnegative().default(0),
  cost: z.number().nonnegative('Cost cannot be negative').default(0),
  sellingPrice: z.number().nonnegative('Selling price cannot be negative').default(0),
  valuationMethod: z.enum(['FIFO', 'WEIGHTED_AVERAGE', 'STANDARD_COST']).default('FIFO'),
  partWeightGrams: z.number().nonnegative().default(0),
  runnerWeightGrams: z.number().nonnegative().default(0),
  cavityCount: z.number().int().positive().default(1),
  cycleTimeSeconds: z.number().nonnegative().default(0),
  moldCode: z.string().optional(),
  resinType: z.string().optional(),
  polymerGrade: z.string().optional(),
  color: z.string().optional(),
  hsnCode: z.string().optional(),
  itemGroup: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PHASE_OUT']).default('ACTIVE'),
  approvalStatus: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).default('APPROVED'),
});

export type CreateItemDto = z.infer<typeof CreateItemDtoSchema>;
