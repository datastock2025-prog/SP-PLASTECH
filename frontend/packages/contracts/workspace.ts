import { z } from 'zod';

export const MODULE_NAME = 'workspace';

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Task title is required'),
  module: z.string().default('General'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  due: z.string().optional(),
  assignedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  status: TaskStatusEnum.default('PENDING'),
  view: z.string().optional(),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateTaskInputSchema = TaskSchema.omit({ id: true });
export const UpdateTaskInputSchema = TaskSchema.partial().extend({
  version: z.number().int().min(1),
});

export const ApprovalStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const ApprovalSchema = z.object({
  id: z.string().optional(),
  documentType: z.string().min(1, 'Document type is required'),
  documentNumber: z.string().min(1, 'Document number is required'),
  requestedBy: z.string().default('System'),
  department: z.string().default('Operations'),
  amount: z.number().min(0).default(0),
  currency: z.string().default('INR'),
  status: ApprovalStatusEnum.default('PENDING'),
  submittedAt: z.string().optional(),
  decidedAt: z.string().optional(),
  decidedBy: z.string().optional(),
  comments: z.string().optional(),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateApprovalInputSchema = ApprovalSchema.omit({ id: true });
export const UpdateApprovalInputSchema = ApprovalSchema.partial().extend({
  version: z.number().int().min(1),
});

export const NotificationTypeEnum = z.enum(['INFO', 'WARNING', 'ALERT', 'SUCCESS']);

export const NotificationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Message is required'),
  type: NotificationTypeEnum.default('INFO'),
  read: z.boolean().default(false),
  timestamp: z.string().optional(),
  actionUrl: z.string().optional(),
});

export const CreateNotificationInputSchema = NotificationSchema.omit({ id: true });

export const SavedPresetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Preset name is required'),
  view: z.string().min(1, 'View identifier is required'),
  filterConfig: z.record(z.string(), z.any()).default({}),
  isDefault: z.boolean().default(false),
  createdBy: z.string().optional(),
});

export const CreateSavedPresetInputSchema = SavedPresetSchema.omit({ id: true });

export type TaskContract = z.infer<typeof TaskSchema>;
export type CreateTaskContract = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskContract = z.infer<typeof UpdateTaskInputSchema>;

export type ApprovalContract = z.infer<typeof ApprovalSchema>;
export type CreateApprovalContract = z.infer<typeof CreateApprovalInputSchema>;
export type UpdateApprovalContract = z.infer<typeof UpdateApprovalInputSchema>;

export type NotificationContract = z.infer<typeof NotificationSchema>;
export type CreateNotificationContract = z.infer<typeof CreateNotificationInputSchema>;

export type SavedPresetContract = z.infer<typeof SavedPresetSchema>;
export type CreateSavedPresetContract = z.infer<typeof CreateSavedPresetInputSchema>;
