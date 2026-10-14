import { z } from 'zod';
import { PurchaseOrder } from '../../../types';

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().min(2, 'Supplier name is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  itemName: z.string().min(1, 'Item name is required'),
  qty: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  paymentTerms: z.string().default('Net 30'),
});

export type CreatePurchaseOrderFormValues = z.infer<typeof createPurchaseOrderSchema>;
export type { PurchaseOrder };
