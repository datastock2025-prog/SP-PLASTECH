import { z } from 'zod';

export const CreateWorkOrderInputSchema = z.object({
  item: z.string().trim().min(1),
  machine: z.string().trim().optional(),
  qty: z.number().positive(),
  uom: z.string().default('PCS'),
  dueDate: z.string().trim().min(1),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  bomId: z.string().optional(),
});

export const UpdateWorkOrderInputSchema = CreateWorkOrderInputSchema.partial().extend({
  status: z.enum([
    'pending_approval',
    'planned',
    'released',
    'material_wait',
    'in_progress',
    'paused',
    'quality_hold',
    'completed',
    'cancelled',
  ]).optional(),
  version: z.number().int().min(1),
});

export const LogProductionEntryInputSchema = z.object({
  workOrderId: z.string().trim().min(1),
  goodQty: z.number().min(0),
  scrapQty: z.number().min(0),
  operator: z.string().trim().min(1),
  shift: z.string().trim().min(1),
  runnerKg: z.number().min(0).default(0),
  lumpsKg: z.number().min(0).default(0),
});
