import { z } from 'zod';

export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(1),
  module: z.string().default('General'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  due: z.string().optional(),
  assignedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  view: z.string().optional(),
});

export const UpdateTaskInputSchema = CreateTaskInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateApprovalInputSchema = z.object({
  documentType: z.string().trim().min(1),
  documentNumber: z.string().trim().min(1),
  requestedBy: z.string().default('System'),
  department: z.string().default('Operations'),
  amount: z.number().min(0).default(0),
  currency: z.string().default('INR'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
});

export const UpdateApprovalInputSchema = CreateApprovalInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateNotificationInputSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  type: z.enum(['INFO', 'WARNING', 'ALERT', 'SUCCESS']).default('INFO'),
  read: z.boolean().default(false),
  actionUrl: z.string().optional(),
});
