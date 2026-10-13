import { z } from 'zod';

export const PlannedOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1, 'Order number is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  uom: z.string().default('PCS'),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  source: z.enum(['mrp', 'manual', 'jit', 'forecast']).default('mrp'),
  status: z.enum(['planned', 'confirmed', 'released', 'cancelled']).default('planned'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreatePlannedOrderInputSchema = PlannedOrderSchema.omit({ id: true });
export const UpdatePlannedOrderInputSchema = PlannedOrderSchema.partial().extend({
  version: z.number().int().min(1),
});

export const MrpRunSchema = z.object({
  id: z.string().optional(),
  runNumber: z.string().min(1, 'Run number is required'),
  planHorizonDays: z.number().int().positive().default(30),
  totalPlannedOrders: z.number().int().min(0).default(0),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('completed'),
  executedAt: z.string().optional(),
});

export const JitScheduleSchema = z.object({
  id: z.string().optional(),
  scheduleNumber: z.string().min(1, 'Schedule number is required'),
  machineId: z.string().min(1, 'Machine ID is required'),
  shift: z.string().min(1, 'Shift is required'),
  planDate: z.string().min(1, 'Plan date is required'),
  status: z.enum(['draft', 'published', 'in_progress', 'completed']).default('published'),
});

export const ShipmentTrackingSchema = z.object({
  trackingNumber: z.string().min(3, 'Tracking number must be at least 3 characters'),
  carrier: z.string().min(2, 'Carrier is required'),
  status: z.enum(['in_transit', 'delivered', 'delayed', 'customs_hold']).default('in_transit'),
  origin: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  estimatedArrival: z.string().optional(),
});

export type PlannedOrderContract = z.infer<typeof PlannedOrderSchema>;
export type CreatePlannedOrderContract = z.infer<typeof CreatePlannedOrderInputSchema>;
export type UpdatePlannedOrderContract = z.infer<typeof UpdatePlannedOrderInputSchema>;
export type MrpRunContract = z.infer<typeof MrpRunSchema>;
export type JitScheduleContract = z.infer<typeof JitScheduleSchema>;
export type ShipmentTrackingContract = z.infer<typeof ShipmentTrackingSchema>;
