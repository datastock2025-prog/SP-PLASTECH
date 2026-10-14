import { z } from 'zod';

export const BomLineSchema = z.object({
  id: z.string().optional(),
  itemCode: z.string().min(1, 'Item code is required'),
  description: z.string().optional().default(''),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'Unit of measure is required'),
  scrapFactor: z.number().min(0).max(100).optional().default(0),
  unitCost: z.number().min(0).optional().default(0),
});

export const BomSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'BOM code is required').trim(),
  itemCode: z.string().min(1, 'Parent item code is required').trim(),
  version: z.string().min(1, 'Version is required').default('v1.0'),
  yieldPercent: z.number().min(1).max(100).default(100),
  status: z.enum(['draft', 'pending_approval', 'approved', 'active', 'obsolete']).default('draft'),
  lines: z.array(BomLineSchema).default([]),
  versionNumber: z.number().int().min(1).optional().default(1),
});

export const CreateBomInputSchema = BomSchema.omit({ id: true });
export const UpdateBomInputSchema = BomSchema.partial().extend({
  versionNumber: z.number().int().min(1),
});

export const EcrSchema = z.object({
  id: z.string().uuid().optional(),
  ecrNumber: z.string().min(1, 'ECR number is required'),
  title: z.string().min(1, 'Title is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IMPLEMENTED']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().optional().default(''),
  requestedBy: z.string().min(1, 'Requested by is required'),
});

export type BomLineContract = z.infer<typeof BomLineSchema>;
export type BomContract = z.infer<typeof BomSchema>;
export type CreateBomContract = z.infer<typeof CreateBomInputSchema>;
export type UpdateBomContract = z.infer<typeof UpdateBomInputSchema>;
export type EcrContract = z.infer<typeof EcrSchema>;
