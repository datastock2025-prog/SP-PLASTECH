import { z } from 'zod';

export const CreateSalesOrderInputSchema = z.object({
  customerId: z.string().trim().min(1),
  itemCode: z.string().trim().min(1),
  quantity: z.number().positive(),
  deliveryDate: z.string().trim().min(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const UpdateSalesOrderInputSchema = CreateSalesOrderInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateCustomerInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  segment: z.string().trim().default('Automotive'),
  creditLimit: z.number().min(0).default(500000),
  contact: z.string().trim().default(''),
  email: z.string().trim().email().or(z.literal('')).default(''),
  phone: z.string().trim().default(''),
});
