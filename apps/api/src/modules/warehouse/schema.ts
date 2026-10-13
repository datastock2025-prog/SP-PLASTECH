import { z } from 'zod';

export const CreateStockTransferInputSchema = z.object({
  itemCode: z.string().trim().min(1),
  fromLocation: z.string().trim().min(1),
  toLocation: z.string().trim().min(1),
  quantity: z.number().positive(),
  reference: z.string().trim().optional().default(''),
  batchNumber: z.string().trim().optional().default(''),
  status: z.enum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).default('COMPLETED'),
});

export const UpdateStockTransferInputSchema = CreateStockTransferInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateBinLocationInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.enum(['warehouse', 'zone', 'aisle', 'rack', 'shelf', 'bin']).default('bin'),
  zone: z.string().trim().optional().default('A'),
  warehouseCode: z.string().trim().optional().default('WH-01'),
});
