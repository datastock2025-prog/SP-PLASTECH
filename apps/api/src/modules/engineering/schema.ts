import { z } from 'zod';

export const BomLineInputSchema = z.object({
  itemCode: z.string().trim().min(1),
  description: z.string().trim().optional().default(''),
  quantity: z.number().positive(),
  uom: z.string().trim().min(1),
  scrapFactor: z.number().min(0).max(100).optional().default(0),
  unitCost: z.number().min(0).optional().default(0),
});

export const CreateBomInputSchema = z.object({
  code: z.string().trim().min(1).max(100),
  itemCode: z.string().trim().min(1).max(100),
  version: z.string().trim().min(1).default('v1.0'),
  yieldPercent: z.number().min(1).max(100).default(100),
  status: z.enum(['draft', 'pending_approval', 'approved', 'active', 'obsolete']).default('draft'),
  lines: z.array(BomLineInputSchema).default([]),
});

export const UpdateBomInputSchema = CreateBomInputSchema.partial().extend({
  versionNumber: z.number().int().min(1),
});

export const CreateEcrInputSchema = z.object({
  ecrNumber: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(255),
  itemCode: z.string().trim().min(1).max(100),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IMPLEMENTED']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().trim().optional().default(''),
  requestedBy: z.string().trim().min(1),
});
