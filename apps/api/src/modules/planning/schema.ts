import { z } from 'zod';

export const CreatePlannedOrderInputSchema = z.object({
  itemCode: z.string().trim().min(1),
  quantity: z.number().positive(),
  startDate: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
  source: z.enum(['mrp', 'manual', 'jit', 'forecast']).default('mrp'),
});

export const UpdatePlannedOrderInputSchema = CreatePlannedOrderInputSchema.partial().extend({
  status: z.enum(['planned', 'confirmed', 'released', 'cancelled']).optional(),
  version: z.number().int().min(1),
});

export const TriggerMrpRunInputSchema = z.object({
  planHorizonDays: z.number().int().positive().default(30),
});
