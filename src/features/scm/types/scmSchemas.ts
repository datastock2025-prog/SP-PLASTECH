import { z } from 'zod';

export const shipmentTrackingSchema = z.object({
  trackingNumber: z.string().min(3),
  carrier: z.string().min(2),
  status: z.enum(['in_transit', 'delivered', 'delayed', 'customs_hold']),
});

export type ShipmentTrackingFormValues = z.infer<typeof shipmentTrackingSchema>;
