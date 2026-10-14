import { z } from 'zod';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepCleanroomZone,
  MepMetric,
  MepWorkOrder,
  MepCategory,
  MepEquipmentStatus,
} from '@/src/types';

export {
  MaintenanceWorkOrderSchema,
  CreateMaintenanceWorkOrderInputSchema,
  UpdateMaintenanceWorkOrderInputSchema,
  EquipmentAssetSchema,
  MeterReadingSchema,
  MepAlarmSchema,
  MaintenanceCategoryEnum,
  MaintenancePriorityEnum,
  MaintenanceStatusEnum,
  EquipmentStatusEnum,
} from '@/packages/contracts/maintenance';

export type {
  MaintenanceWorkOrderContract,
  CreateMaintenanceWorkOrderContract,
  UpdateMaintenanceWorkOrderContract,
  EquipmentAssetContract,
  MeterReadingContract,
  MepAlarmContract,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  EquipmentStatus,
} from '@/packages/contracts/maintenance';

export const maintenanceWorkOrderFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  equipmentId: z.string().min(1, 'Equipment selection is required'),
  category: z.enum(['Mechanical', 'Electrical', 'Plumbing', 'HVAC & Cleanroom', 'Facility']).default('Mechanical'),
  type: z.enum(['Preventative (PM)', 'Breakdown', 'Calibration', 'Overhaul', 'Audit Finding']).default('Preventative (PM)'),
  priority: z.enum(['Emergency', 'High', 'Medium', 'Low']).default('Medium'),
  assignedTo: z.string().min(1, 'Assigned technician is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  estimatedHours: z.number().min(0.5, 'Estimated hours must be at least 0.5'),
});

export type MaintenanceWorkOrderFormValues = z.infer<typeof maintenanceWorkOrderFormSchema>;

export type {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepCleanroomZone,
  MepMetric,
  MepWorkOrder,
  MepCategory,
  MepEquipmentStatus,
};
