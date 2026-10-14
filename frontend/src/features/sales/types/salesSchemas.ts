import { z } from 'zod';
import { SalesOrder, Customer, Quotation } from '../../../types';

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  itemCode: z.string().min(1, 'Item selection is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  deliveryDate: z.string().min(1, 'Delivery schedule date is required'),
});

export type CreateSalesOrderFormValues = z.infer<typeof createSalesOrderSchema>;
export type { SalesOrder, Customer, Quotation };
