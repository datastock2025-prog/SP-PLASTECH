import { z } from 'zod';

export const PurchaseOrderLineInputSchema = z.object({
  item: z.string().trim().min(1),
  name: z.string().trim().min(1),
  qty: z.number().positive(),
  uom: z.string().trim().min(1).default('KG'),
  price: z.number().min(0).default(0),
});

export const CreatePurchaseOrderInputSchema = z.object({
  supplier: z.string().trim().min(1),
  orderDate: z.string().trim().min(1),
  expectedDate: z.string().trim().min(1),
  approval: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  status: z.enum(['draft', 'issued', 'partially_received', 'received', 'closed', 'cancelled']).default('draft'),
  lines: z.array(PurchaseOrderLineInputSchema).min(1),
});

export const UpdatePurchaseOrderInputSchema = CreatePurchaseOrderInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateSupplierInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().default('Manufacturer'),
  category: z.string().default('Virgin Resin'),
  status: z.enum(['active', 'pending_approval', 'blocked', 'preferred', 'under_review', 'inactive']).default('active'),
  paymentTerms: z.string().default('Net 30'),
});
