import { z } from 'zod';

export const PurchaseOrderLineSchema = z.object({
  id: z.string().optional(),
  item: z.string().min(1, 'Item code is required'),
  name: z.string().min(1, 'Item name is required'),
  qty: z.number().positive('Quantity must be greater than zero'),
  uom: z.string().min(1, 'Unit of measure is required').default('KG'),
  price: z.number().min(0, 'Price cannot be negative'),
  received: z.number().min(0).default(0),
});

export const PurchaseOrderSchema = z.object({
  id: z.string().min(1, 'PO number is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDate: z.string().min(1, 'Expected date is required'),
  approval: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  status: z.enum(['draft', 'issued', 'partially_received', 'received', 'closed', 'cancelled']).optional().default('draft'),
  lines: z.array(PurchaseOrderLineSchema).min(1, 'At least one line item is required'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreatePurchaseOrderInputSchema = PurchaseOrderSchema.omit({ id: true });
export const UpdatePurchaseOrderInputSchema = PurchaseOrderSchema.partial().extend({
  version: z.number().int().min(1),
});

export const PurchaseRequisitionSchema = z.object({
  id: z.string().min(1, 'PR ID is required'),
  prNumber: z.string().min(1, 'PR Number is required'),
  department: z.string().min(1, 'Department is required'),
  requester: z.string().min(1, 'Requester is required'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO']).default('DRAFT'),
  items: z.array(z.object({
    itemCode: z.string().min(1),
    itemName: z.string().min(1),
    quantity: z.number().positive(),
    uom: z.string().min(1),
    estimatedCost: z.number().min(0).optional().default(0),
  })).default([]),
});

export const SupplierMasterSchema = z.object({
  id: z.string().min(1, 'Supplier ID is required'),
  code: z.string().min(1, 'Supplier code is required'),
  name: z.string().min(1, 'Supplier name is required'),
  type: z.string().default('Manufacturer'),
  category: z.string().default('Virgin Resin'),
  status: z.enum(['active', 'pending_approval', 'blocked', 'preferred', 'under_review', 'inactive']).default('active'),
  paymentTerms: z.string().default('Net 30'),
});

export const GoodsReceiptNoteSchema = z.object({
  id: z.string().min(1, 'GRN ID is required'),
  grnNumber: z.string().min(1, 'GRN number is required'),
  poNumber: z.string().min(1, 'PO number is required'),
  supplierCode: z.string().min(1, 'Supplier code is required'),
  receivedDate: z.string().min(1, 'Received date is required'),
  status: z.enum(['draft', 'inspected', 'posted', 'rejected']).default('draft'),
});

export type PurchaseOrderLineContract = z.infer<typeof PurchaseOrderLineSchema>;
export type PurchaseOrderContract = z.infer<typeof PurchaseOrderSchema>;
export type CreatePurchaseOrderContract = z.infer<typeof CreatePurchaseOrderInputSchema>;
export type UpdatePurchaseOrderContract = z.infer<typeof UpdatePurchaseOrderInputSchema>;
export type PurchaseRequisitionContract = z.infer<typeof PurchaseRequisitionSchema>;
export type SupplierMasterContract = z.infer<typeof SupplierMasterSchema>;
export type GoodsReceiptNoteContract = z.infer<typeof GoodsReceiptNoteSchema>;
