import { z } from 'zod';

export const CreateMaintenanceWorkOrderInputSchema = z.object({
  workOrderNumber: z.string().trim().min(1),
  title: z.string().trim().min(1),
  equipmentId: z.string().trim().min(1),
  equipmentName: z.string().trim().default(''),
  category: z.enum(['Mechanical', 'Electrical', 'Plumbing', 'HVAC & Cleanroom', 'Facility']).default('Mechanical'),
  type: z.enum(['Preventative (PM)', 'Breakdown', 'Calibration', 'Overhaul', 'Audit Finding']).default('Preventative (PM)'),
  priority: z.enum(['Emergency', 'High', 'Medium', 'Low']).default('Medium'),
  status: z.enum(['Draft', 'Assigned', 'In Progress', 'Pending Parts', 'Completed', 'Signed Off']).default('Assigned'),
  assignedTo: z.string().trim().default('Unassigned'),
  dueDate: z.string().trim().min(1),
  estimatedHours: z.number().min(0).default(1),
});

export const UpdateMaintenanceWorkOrderInputSchema = CreateMaintenanceWorkOrderInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateEquipmentAssetInputSchema = z.object({
  assetCode: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum(['Mechanical', 'Electrical', 'Plumbing', 'HVAC & Cleanroom', 'Facility']).default('Mechanical'),
  location: z.string().trim().default('Main Plant'),
  status: z.enum(['Running', 'Standby', 'Warning', 'Tripped', 'Maintenance']).default('Running'),
});

export const UpdateEquipmentAssetInputSchema = CreateEquipmentAssetInputSchema.partial().extend({
  version: z.number().int().min(1),
});
