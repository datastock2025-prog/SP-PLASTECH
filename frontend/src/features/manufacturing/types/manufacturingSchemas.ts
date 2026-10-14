import { z } from 'zod';
import { WorkOrder, MachineMaster } from '../../../types';

export interface OutputLog {
  time: string;
  good: number;
  scrap: number;
  by: string;
  rejReason?: string;
}

export const workOrderLogSchema = z.object({
  workOrderId: z.string().min(1, 'Work order selection is required'),
  goodQty: z.number().min(0, 'Good quantity cannot be negative'),
  scrapQty: z.number().min(0, 'Scrap quantity cannot be negative'),
  operator: z.string().min(2, 'Operator name is required'),
  shift: z.string().min(1, 'Shift identifier is required'),
  reasonCode: z.string().optional(),
  machineId: z.string().optional(),
});

export type WorkOrderLogFormValues = z.infer<typeof workOrderLogSchema>;

export const createWorkOrderSchema = z.object({
  itemCode: z.string().min(1, 'Item selection is required'),
  itemName: z.string().min(1, 'Item name is required'),
  qty: z.number().positive('Quantity must be greater than zero'),
  machineId: z.string().min(1, 'Target machine is required'),
  dueDate: z.string().min(1, 'Target completion date is required'),
  bomId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type CreateWorkOrderFormValues = z.infer<typeof createWorkOrderSchema>;

export type { WorkOrder, MachineMaster };
