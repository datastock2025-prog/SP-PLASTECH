import { z } from 'zod';

export const CreateNcrInputSchema = z.object({
  title: z.string().trim().min(5),
  itemCode: z.string().trim().min(1),
  severity: z.enum(['Minor', 'Major', 'Critical']),
  defectType: z.string().trim().min(2),
  lotNumber: z.string().trim().min(2),
  reportedBy: z.string().trim().min(2),
  description: z.string().trim().min(10),
  quantityAffected: z.number().positive(),
});

export const UpdateNcrInputSchema = CreateNcrInputSchema.partial().extend({
  status: z.enum(['open', 'investigating', 'capa_pending', 'closed', 'rejected']).optional(),
  version: z.number().int().min(1),
});

export const CreateCapaInputSchema = z.object({
  title: z.string().trim().min(5),
  ncrId: z.string().trim().optional(),
  assignedTo: z.string().trim().min(2),
  dueDate: z.string().trim().min(1),
  rootCause: z.string().trim().optional().default(''),
  actionPlan: z.string().trim().optional().default(''),
});
