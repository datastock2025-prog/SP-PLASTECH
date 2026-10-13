import { z } from 'zod';

export const WorkOrderSchema = z.object({
  id: z.string().optional(),
  item: z.string().min(1, 'Item code is required'),
  bomId: z.string().nullable().optional().default(null),
  machine: z.string().nullable().optional().default(null),
  qty: z.number().positive('Quantity must be greater than zero'),
  uom: z.string().default('PCS'),
  completed: z.number().min(0).default(0),
  scrap: z.number().min(0).default(0),
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
  ]).default('planned'),
  priority: z.enum(['Low', 'Medium', 'High', 'urgent', 'low', 'medium', 'high']).default('Medium'),
  dueDate: z.string().min(1, 'Due date is required'),
  operator: z.string().default('Operator 1'),
  shift: z.string().optional().default('Shift A'),
  mold: z.string().optional(),
  moldId: z.string().optional(),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateWorkOrderInputSchema = WorkOrderSchema.omit({ id: true });
export const UpdateWorkOrderInputSchema = WorkOrderSchema.partial().extend({
  version: z.number().int().min(1),
});

export const WorkOrderLogSchema = z.object({
  workOrderId: z.string().min(1, 'Work order selection is required'),
  goodQty: z.number().min(0, 'Good quantity cannot be negative'),
  scrapQty: z.number().min(0, 'Scrap quantity cannot be negative'),
  operator: z.string().min(2, 'Operator name is required'),
  shift: z.string().min(1, 'Shift identifier is required'),
  reasonCode: z.string().optional(),
  machineId: z.string().optional(),
});

export const MachineMasterSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(1, 'Machine name is required'),
  type: z.enum([
    'Injection Molding Machine',
    'Extrusion Line',
    'Blow Molding Machine',
    'Mold / Tooling',
    'Auxiliary Equipment',
  ]).default('Injection Molding Machine'),
  line: z.string().default('Line 1'),
  status: z.enum(['running', 'idle', 'breakdown', 'maintenance', 'in_use']).default('idle'),
  tonnage: z.string().default('250T'),
  hourlyRate: z.number().optional().default(1200),
});

export const DailyProductionEntrySchema = z.object({
  id: z.string().optional(),
  workOrderId: z.string().min(1, 'Work order ID is required'),
  machineId: z.string().min(1, 'Machine ID is required'),
  shift: z.string().min(1, 'Shift is required'),
  operator: z.string().min(1, 'Operator is required'),
  goodQty: z.number().min(0).default(0),
  scrapQty: z.number().min(0).default(0),
  runnerKg: z.number().min(0).default(0),
  lumpsKg: z.number().min(0).default(0),
  entryDate: z.string().optional(),
});

export const RegrindEntrySchema = z.object({
  id: z.string().optional(),
  workOrderId: z.string().min(1, 'Work order is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  regrindWeightKg: z.number().min(0).default(0),
  virginWeightKg: z.number().min(0).default(0),
  ratioPct: z.number().min(0).max(100).default(0),
});

export type WorkOrderContract = z.infer<typeof WorkOrderSchema>;
export type CreateWorkOrderContract = z.infer<typeof CreateWorkOrderInputSchema>;
export type UpdateWorkOrderContract = z.infer<typeof UpdateWorkOrderInputSchema>;
export type WorkOrderLogContract = z.infer<typeof WorkOrderLogSchema>;
export type MachineMasterContract = z.infer<typeof MachineMasterSchema>;
export type DailyProductionEntryContract = z.infer<typeof DailyProductionEntrySchema>;
export type RegrindEntryContract = z.infer<typeof RegrindEntrySchema>;
