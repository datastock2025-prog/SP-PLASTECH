import { z } from 'zod';

// ==================== SCREEN 1: DASHBOARD WIDGETS ====================
export const CreateDashboardWidgetDtoSchema = z.object({
  widgetType: z.enum([
    'PENDING_TASKS',
    'MY_APPROVALS',
    'PRODUCTION_STATUS',
    'MRP_SHORTAGES',
    'INVENTORY_ALERTS',
    'QUALITY_ISSUES',
    'MACHINE_DOWNTIME',
    'CUSTOM',
  ]),
  title: z.string().min(1, 'Title is required'),
  config: z.record(z.any()).default({}),
  position: z.number().int().default(1),
  isVisible: z.boolean().default(true),
  refreshInterval: z.number().int().default(300),
});
export type CreateDashboardWidgetDto = z.infer<typeof CreateDashboardWidgetDtoSchema>;

export const UpdateDashboardWidgetDtoSchema = CreateDashboardWidgetDtoSchema.partial();
export type UpdateDashboardWidgetDto = z.infer<typeof UpdateDashboardWidgetDtoSchema>;

// ==================== SCREEN 2: MY TASKS ====================
export const CreateTaskDtoSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  assignedToId: z.string().min(1, 'Assignee ID is required'),
  taskType: z.enum(['APPROVAL_REQUEST', 'INSPECTION', 'DATA_ENTRY', 'REVIEW', 'MAINTENANCE', 'QUALITY_CHECK', 'CUSTOM']).default('CUSTOM'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).default('PENDING'),
  dueDate: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});
export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;

export const UpdateTaskStatusDtoSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']),
});
export type UpdateTaskStatusDto = z.infer<typeof UpdateTaskStatusDtoSchema>;

// ==================== SCREEN 3: MY APPROVALS ====================
export const SubmitApprovalRequestDtoSchema = z.object({
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  metadata: z.record(z.any()).optional().default({}),
  stages: z.array(
    z.object({
      stageNumber: z.number().int(),
      approverId: z.string(),
      approverEmail: z.string().email(),
      approverName: z.string(),
      required: z.boolean().default(true),
    })
  ).min(1, 'At least one approval stage required'),
});
export type SubmitApprovalRequestDto = z.infer<typeof SubmitApprovalRequestDtoSchema>;

export const ProcessApprovalStageActionDtoSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'ESCALATE']),
  comments: z.string().optional(),
});
export type ProcessApprovalStageActionDto = z.infer<typeof ProcessApprovalStageActionDtoSchema>;

// ==================== SCREEN 4: NOTIFICATIONS ====================
export const CreateNotificationDtoSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['SYSTEM_ALERT', 'PRODUCTION_HALT', 'QUALITY_ISSUE', 'INVENTORY_LOW', 'MAINTENANCE_DUE', 'APPROVAL_REQUEST', 'TASK_ASSIGNED', 'MRP_SHORTAGE', 'CUSTOM']).default('SYSTEM_ALERT'),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).default('INFO'),
  actionUrl: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
  expiresAt: z.string().optional(),
});
export type CreateNotificationDto = z.infer<typeof CreateNotificationDtoSchema>;

// ==================== SCREEN 5: SAVED VIEWS ====================
export const CreateSavedViewDtoSchema = z.object({
  name: z.string().min(1, 'View name is required'),
  module: z.string().min(1, 'Module is required'),
  filters: z.record(z.any()).default({}),
  columns: z.array(z.string()).optional().default([]),
  sortOrder: z.record(z.any()).optional().default({}),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});
export type CreateSavedViewDto = z.infer<typeof CreateSavedViewDtoSchema>;

export const UpdateSavedViewDtoSchema = CreateSavedViewDtoSchema.partial();
export type UpdateSavedViewDto = z.infer<typeof UpdateSavedViewDtoSchema>;

// ==================== SCREEN 6: RECENT RECORDS ====================
export const LogRecentRecordDtoSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  recordName: z.string().min(1),
  recordUrl: z.string().min(1),
  metadata: z.record(z.any()).optional().default({}),
});
export type LogRecentRecordDto = z.infer<typeof LogRecentRecordDtoSchema>;
