import { z } from 'zod';
import { BomMaster } from '../../../types';

export const bomVersionSchema = z.object({
  code: z.string().min(1, 'BOM code is required'),
  itemCode: z.string().min(1, 'Target parent item is required'),
  version: z.string().min(1, 'BOM revision is required'),
  yieldPercent: z.number().min(1).max(100),
  status: z.enum(['draft', 'active', 'obsolete']),
});

export type BomVersionFormValues = z.infer<typeof bomVersionSchema>;
export type { BomMaster };
