import { z } from 'zod';

// ==========================================
// USER DIRECTORY DTOs
// ==========================================
export const CreateUserDtoSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  username: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().default('Operations'),
  roleId: z.string().min(1),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  plantIds: z.array(z.string()).default(['PLANT-01']),
  assignedShift: z.string().optional(),
  badgeId: z.string().optional(),
  avatarColor: z.string().optional(),
  initials: z.string().optional(),
  password: z.string().min(6).optional().default('Reboot2026!#'),
  pin: z.string().length(4).optional().default('1234'),
  status: z.enum(['Active', 'Suspended', 'Pending Verification']).default('Active'),
  mfaEnabled: z.boolean().default(false),
  mfaMethod: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

export const UpdateUserDtoSchema = CreateUserDtoSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;

// ==========================================
// ROLE & PERMISSION DTOs
// ==========================================
export const CreateRoleDtoSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  scope: z.string().default('Plant Scoped'),
  department: z.string().default('General'),
  isSystemRole: z.boolean().default(false),
  permissions: z.array(z.string()).default([]),
});

export type CreateRoleDto = z.infer<typeof CreateRoleDtoSchema>;

export const UpdateRoleDtoSchema = CreateRoleDtoSchema.partial();
export type UpdateRoleDto = z.infer<typeof UpdateRoleDtoSchema>;

// ==========================================
// PLANT & FACILITY DTOs
// ==========================================
export const CreatePlantDtoSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  location: z.string().min(2),
  entityType: z.string().default('Plant'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  gstin: z.string().optional(),
  capacityRating: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreatePlantDto = z.infer<typeof CreatePlantDtoSchema>;

export const UpdatePlantDtoSchema = CreatePlantDtoSchema.partial();
export type UpdatePlantDto = z.infer<typeof UpdatePlantDtoSchema>;

// ==========================================
// NUMBERING SEQUENCE DTOs
// ==========================================
export const CreateNumberingSequenceDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  module: z.string().min(1),
  documentType: z.string().min(1),
  prefix: z.string().min(1),
  includeYear: z.boolean().default(true),
  yearFormat: z.enum(['YYYY', 'YY']).default('YYYY'),
  includeMonth: z.boolean().default(false),
  separator: z.string().default('-'),
  paddingLength: z.number().int().min(2).max(10).default(4),
  currentNumber: z.number().int().min(1).default(1),
  stepSize: z.number().int().min(1).default(1),
  resetFrequency: z.enum(['Never', 'Yearly', 'Monthly']).default('Yearly'),
  isActive: z.boolean().default(true),
});

export type CreateNumberingSequenceDto = z.infer<typeof CreateNumberingSequenceDtoSchema>;

export const UpdateNumberingSequenceDtoSchema = CreateNumberingSequenceDtoSchema.partial();
export type UpdateNumberingSequenceDto = z.infer<typeof UpdateNumberingSequenceDtoSchema>;

// ==========================================
// APPROVAL WORKFLOW DTOs
// ==========================================
export const ApprovalTierSchema = z.object({
  tier: z.number().int(),
  role: z.string(),
  threshold: z.number().optional(),
  action: z.string(),
  timeLimitHours: z.number().optional(),
});

export const CreateWorkflowDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  name: z.string().min(2),
  module: z.string().min(1),
  documentType: z.string().min(1),
  description: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional().nullable(),
  tiers: z.array(ApprovalTierSchema).default([]),
  isActive: z.boolean().default(true),
});

export type CreateWorkflowDto = z.infer<typeof CreateWorkflowDtoSchema>;

export const UpdateWorkflowDtoSchema = CreateWorkflowDtoSchema.partial();
export type UpdateWorkflowDto = z.infer<typeof UpdateWorkflowDtoSchema>;

// ==========================================
// SYSTEM PARAMETER DTOs
// ==========================================
export const CreateSystemParamDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  paramGroup: z.string().min(1),
  paramKey: z.string().min(1),
  paramName: z.string().min(1),
  paramValue: z.string(),
  defaultValue: z.string(),
  valueType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreateSystemParamDto = z.infer<typeof CreateSystemParamDtoSchema>;

export const UpdateSystemParamDtoSchema = CreateSystemParamDtoSchema.partial();
export type UpdateSystemParamDto = z.infer<typeof UpdateSystemParamDtoSchema>;
