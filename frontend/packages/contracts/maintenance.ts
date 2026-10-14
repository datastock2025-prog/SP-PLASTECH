import { z } from 'zod';

export const MaintenanceCategoryEnum = z.enum([
  'Mechanical',
  'Electrical',
  'Plumbing',
  'HVAC & Cleanroom',
  'Facility',
]);

export const MaintenancePriorityEnum = z.enum(['Emergency', 'High', 'Medium', 'Low']);

export const MaintenanceStatusEnum = z.enum([
  'Draft',
  'Assigned',
  'In Progress',
  'Pending Parts',
  'Completed',
  'Signed Off',
]);

export const EquipmentStatusEnum = z.enum([
  'Running',
  'Standby',
  'Warning',
  'Tripped',
  'Maintenance',
]);

export const MaintenanceWorkOrderSchema = z.object({
  id: z.string().optional(),
  workOrderNumber: z.string().min(1, 'Work order number is required'),
  title: z.string().min(1, 'Title is required'),
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  equipmentName: z.string().default(''),
  category: MaintenanceCategoryEnum.default('Mechanical'),
  type: z.enum(['Preventative (PM)', 'Breakdown', 'Calibration', 'Overhaul', 'Audit Finding']).default('Preventative (PM)'),
  priority: MaintenancePriorityEnum.default('Medium'),
  status: MaintenanceStatusEnum.default('Assigned'),
  assignedTo: z.string().default('Unassigned'),
  dueDate: z.string().min(1, 'Due date is required'),
  scheduledDate: z.string().optional(),
  estimatedHours: z.number().min(0).default(1),
  actualHours: z.number().min(0).optional().default(0),
  permitRequired: z.boolean().default(false),
  permitType: z.enum(['LOTO (Lockout/Tagout)', 'Hot Work', 'Confined Space', 'Electrical Safety']).optional(),
  rootCause: z.string().optional(),
  completionNotes: z.string().optional(),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateMaintenanceWorkOrderInputSchema = MaintenanceWorkOrderSchema.omit({ id: true });
export const UpdateMaintenanceWorkOrderInputSchema = MaintenanceWorkOrderSchema.partial().extend({
  version: z.number().int().min(1),
});

export const EquipmentAssetSchema = z.object({
  id: z.string().optional(),
  assetCode: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  category: MaintenanceCategoryEnum.default('Mechanical'),
  subSystem: z.string().default('General'),
  location: z.string().default('Main Plant'),
  status: EquipmentStatusEnum.default('Running'),
  capacity: z.string().default('N/A'),
  currentLoadPct: z.number().min(0).max(100).default(0),
  powerRatingKw: z.number().min(0).default(0),
  healthScore: z.number().min(0).max(100).default(100),
  lastPmDate: z.string().optional(),
  nextPmDue: z.string().optional(),
  runningHours: z.number().min(0).default(0),
  efficiency: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  version: z.number().int().min(1).optional().default(1),
});

export const MeterReadingSchema = z.object({
  id: z.string().optional(),
  meterId: z.string().min(1, 'Meter ID is required'),
  name: z.string().default(''),
  zone: z.string().default('Main Plant'),
  activePowerKw: z.number().min(0).default(0),
  powerFactor: z.number().min(-1).max(1).default(0.95),
  todayKwh: z.number().min(0).default(0),
  status: z.enum(['normal', 'peak_alert', 'pf_penalty_risk']).default('normal'),
  timestamp: z.string().optional(),
});

export const MepAlarmSchema = z.object({
  id: z.string().optional(),
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  equipmentName: z.string().default(''),
  severity: z.enum(['Critical', 'Major', 'Minor', 'Warning']).default('Warning'),
  title: z.string().min(1, 'Title is required'),
  desc: z.string().default(''),
  timestamp: z.string().optional(),
  status: z.enum(['Active', 'Acknowledged', 'Resolved']).default('Active'),
  actionRequired: z.string().default(''),
  acknowledgedBy: z.string().optional(),
});

export type MaintenanceCategory = z.infer<typeof MaintenanceCategoryEnum>;
export type MaintenancePriority = z.infer<typeof MaintenancePriorityEnum>;
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusEnum>;
export type EquipmentStatus = z.infer<typeof EquipmentStatusEnum>;

export type MaintenanceWorkOrderContract = z.infer<typeof MaintenanceWorkOrderSchema>;
export type CreateMaintenanceWorkOrderContract = z.infer<typeof CreateMaintenanceWorkOrderInputSchema>;
export type UpdateMaintenanceWorkOrderContract = z.infer<typeof UpdateMaintenanceWorkOrderInputSchema>;
export type EquipmentAssetContract = z.infer<typeof EquipmentAssetSchema>;
export type MeterReadingContract = z.infer<typeof MeterReadingSchema>;
export type MepAlarmContract = z.infer<typeof MepAlarmSchema>;
