import { z } from 'zod';
import { SalesOrder, Customer, Quotation, SalesQuotation } from '@/src/types';

export {
  SalesOrderSchema,
  SalesOrderLineSchema,
  CreateSalesOrderInputSchema,
  UpdateSalesOrderInputSchema,
  CustomerSchema,
  SalesQuotationSchema,
  DeliveryChallanSchema,
} from '@/packages/contracts/sales';

export type {
  SalesOrderContract,
  SalesOrderLineContract,
  CreateSalesOrderContract,
  UpdateSalesOrderContract,
  CustomerContract,
  SalesQuotationContract,
  DeliveryChallanContract,
} from '@/packages/contracts/sales';

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  itemCode: z.string().min(1, 'Item selection is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  deliveryDate: z.string().min(1, 'Delivery schedule date is required'),
});

export type CreateSalesOrderFormValues = z.infer<typeof createSalesOrderSchema>;
export type { SalesOrder, Customer, Quotation, SalesQuotation };
