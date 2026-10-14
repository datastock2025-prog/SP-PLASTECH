import { z } from 'zod';

export {
  PlannedOrderSchema,
  CreatePlannedOrderInputSchema,
  UpdatePlannedOrderInputSchema,
  MrpRunSchema,
  JitScheduleSchema,
  ShipmentTrackingSchema,
} from '@/packages/contracts/planning';

export type {
  PlannedOrderContract,
  CreatePlannedOrderContract,
  UpdatePlannedOrderContract,
  MrpRunContract,
  JitScheduleContract,
  ShipmentTrackingContract,
} from '@/packages/contracts/planning';

export const shipmentTrackingFormSchema = z.object({
  trackingNumber: z.string().min(3, 'Tracking number must be at least 3 characters'),
  carrier: z.string().min(2, 'Carrier name is required'),
  status: z.enum(['in_transit', 'delivered', 'delayed', 'customs_hold']).default('in_transit'),
});

export type ShipmentTrackingFormValues = z.infer<typeof shipmentTrackingFormSchema>;
