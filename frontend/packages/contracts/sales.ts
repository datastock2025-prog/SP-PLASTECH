import { z } from 'zod';

export const SalesOrderLineSchema = z.object({
  item: z.string().min(1, 'Item code is required'),
  name: z.string().min(1, 'Item name is required'),
  qty: z.number().positive('Quantity must be greater than zero'),
  uom: z.string().default('PCS'),
  price: z.number().min(0, 'Price must be non-negative'),
  dispatched: z.number().min(0).default(0),
});

export const SalesOrderSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(1, 'Customer name is required'),
  customerPO: z.string().optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'Low', 'Medium', 'High']).default('medium'),
  quoteRef: z.string().optional().default(''),
  orderDate: z.string().min(1, 'Order date is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  approval: z.enum(['draft', 'pending', 'approved', 'rejected']).default('approved'),
  rejectReason: z.string().optional().default(''),
  lines: z.array(SalesOrderLineSchema).min(1, 'At least one line item is required'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateSalesOrderInputSchema = SalesOrderSchema.omit({ id: true });
export const UpdateSalesOrderInputSchema = SalesOrderSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CustomerSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Customer code is required'),
  name: z.string().min(1, 'Customer name is required'),
  segment: z.string().default('Automotive'),
  creditLimit: z.number().min(0).default(500000),
  contact: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  phone: z.string().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
  gstin: z.string().optional().default(''),
  pan: z.string().optional().default(''),
  paymentTerms: z.string().default('Net 30'),
});

export const SalesQuotationSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(1, 'Customer is required'),
  customerRfq: z.string().optional().default(''),
  date: z.string().min(1, 'Date is required'),
  validUntil: z.string().min(1, 'Valid until is required'),
  currency: z.string().default('INR'),
  salesperson: z.string().default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  stage: z.enum(['draft', 'pending', 'approved', 'sent', 'reviewing', 'accepted', 'lost', 'expired', 'converted']).default('draft'),
  approval: z.enum(['draft', 'pending', 'approved', 'rejected']).default('approved'),
  margin: z.number().default(15),
  convertedSo: z.string().nullable().default(null),
});

export const DeliveryChallanSchema = z.object({
  id: z.string().optional(),
  challanNumber: z.string().min(1, 'Challan number is required'),
  customer: z.string().min(1, 'Customer is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  status: z.string().default('Draft'),
  transporter: z.string().optional().default(''),
  eWayBillNo: z.string().optional().default(''),
});

export type SalesOrderLineContract = z.infer<typeof SalesOrderLineSchema>;
export type SalesOrderContract = z.infer<typeof SalesOrderSchema>;
export type CreateSalesOrderContract = z.infer<typeof CreateSalesOrderInputSchema>;
export type UpdateSalesOrderContract = z.infer<typeof UpdateSalesOrderInputSchema>;
export type CustomerContract = z.infer<typeof CustomerSchema>;
export type SalesQuotationContract = z.infer<typeof SalesQuotationSchema>;
export type DeliveryChallanContract = z.infer<typeof DeliveryChallanSchema>;
