import { z } from 'zod';

// ==========================================
// SCREEN 1: USER DIRECTORY
// ==========================================
export const CreateUserDtoSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  username: z.string().optional(),
  fullName: z.string().min(2),
  employeeCode: z.string().optional(),
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
  status: z.enum(['Active', 'Suspended', 'Pending Verification', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']).default('Active'),
  mfaEnabled: z.boolean().default(false),
  mfaMethod: z.string().optional(),
});
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
export const UpdateUserDtoSchema = CreateUserDtoSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;

// ==========================================
// SCREEN 2: USER GROUPS & CREWS
// ==========================================
export const CreateUserGroupDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  groupCode: z.string().min(2),
  groupName: z.string().min(2),
  groupType: z.enum(['CREW', 'DEPARTMENT', 'PROJECT', 'SHIFT_TEAM', 'MAINTENANCE', 'QUALITY', 'CUSTOM']).default('CREW'),
  description: z.string().optional(),
  plantId: z.string().optional(),
  supervisorId: z.string().optional(),
  maxMembers: z.number().int().optional(),
  isActive: z.boolean().default(true),
});
export type CreateUserGroupDto = z.infer<typeof CreateUserGroupDtoSchema>;

export const AddMemberDtoSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['MEMBER', 'LEAD', 'SUPERVISOR']).default('MEMBER'),
});
export type AddMemberDto = z.infer<typeof AddMemberDtoSchema>;

// ==========================================
// SCREEN 3: RBAC PERMISSION MATRIX & SIMULATOR
// ==========================================
export const CreateRoleDtoSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  roleCode: z.string().optional(),
  description: z.string().optional(),
  scope: z.string().default('Plant Scoped'),
  department: z.string().default('General'),
  isSystemRole: z.boolean().default(false),
  parentRoleId: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});
export type CreateRoleDto = z.infer<typeof CreateRoleDtoSchema>;
export const UpdateRoleDtoSchema = CreateRoleDtoSchema.partial();
export type UpdateRoleDto = z.infer<typeof UpdateRoleDtoSchema>;

export const UpdatePermissionsDtoSchema = z.object({
  permissions: z.array(z.string()),
});
export type UpdatePermissionsDto = z.infer<typeof UpdatePermissionsDtoSchema>;

export const SimulateRoleDtoSchema = z.object({
  roleId: z.string().min(1),
  scenario: z.string().default('Approve purchase order over ₹500,000'),
  resource: z.string().default('purchaseRequisition'),
  action: z.string().default('approve'),
  context: z.record(z.string(), z.any()).default({}),
});
export type SimulateRoleDto = z.infer<typeof SimulateRoleDtoSchema>;

// ==========================================
// SCREEN 4: RBAC MULTI-CONTEXT SECURITY
// ==========================================
export const CreateContextDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  contextType: z.enum(['TENANT', 'PLANT', 'DEPARTMENT', 'WAREHOUSE', 'MACHINE', 'WORK_CENTER', 'SHIFT', 'PROJECT']),
  contextId: z.string().min(1),
  contextName: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CreateContextDto = z.infer<typeof CreateContextDtoSchema>;

export const AssignContextDtoSchema = z.object({
  contextId: z.string().min(1),
  accessLevel: z.enum(['NONE', 'READ', 'WRITE', 'APPROVE', 'ADMIN']).default('READ'),
  restrictions: z.record(z.string(), z.any()).optional().default({}),
  timeRestriction: z.record(z.string(), z.any()).optional(),
});
export type AssignContextDto = z.infer<typeof AssignContextDtoSchema>;

// ==========================================
// SCREEN 5: APPROVAL WORKFLOWS
// ==========================================
export const CreateWorkflowDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  name: z.string().min(2),
  module: z.string().min(1),
  documentType: z.string().min(1),
  description: z.string().optional(),
  minAmount: z.number().min(0).default(0),
  maxAmount: z.number().optional(),
  conditionFormula: z.string().optional(),
  slaHoursTotal: z.number().default(24),
  tiers: z.array(z.any()).default([]),
  isActive: z.boolean().default(true),
});
export type CreateWorkflowDto = z.infer<typeof CreateWorkflowDtoSchema>;
export const UpdateWorkflowDtoSchema = CreateWorkflowDtoSchema.partial();
export type UpdateWorkflowDto = z.infer<typeof UpdateWorkflowDtoSchema>;

// ==========================================
// SCREEN 6: COMPANY & ORGANIZATION
// ==========================================
export const UpdateCompanyDtoSchema = z.object({
  companyCode: z.string().optional(),
  legalName: z.string().min(2),
  tradeName: z.string().optional(),
  registrationNo: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  tan: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIfsc: z.string().optional(),
  logoUrl: z.string().optional(),
});
export type UpdateCompanyDto = z.infer<typeof UpdateCompanyDtoSchema>;

// ==========================================
// SCREEN 7: PLANTS & BRANCHES
// ==========================================
export const CreatePlantDtoSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  location: z.string().min(2),
  plantType: z.enum(['MAIN', 'BRANCH', 'WAREHOUSE_ONLY', 'R_D_CENTER']).default('MAIN'),
  entityType: z.string().default('Plant'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  pincode: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  gstin: z.string().optional(),
  operatingHours: z.string().default('24x7'),
  capacity: z.number().optional(),
  capacityRating: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreatePlantDto = z.infer<typeof CreatePlantDtoSchema>;
export const UpdatePlantDtoSchema = CreatePlantDtoSchema.partial();
export type UpdatePlantDto = z.infer<typeof UpdatePlantDtoSchema>;

// ==========================================
// SCREEN 8: WAREHOUSE & SILO LOCATIONS
// ==========================================
export const CreateWarehouseDtoSchema = z.object({
  id: z.string().optional(),
  plantId: z.string().min(1),
  warehouseCode: z.string().min(2),
  warehouseName: z.string().min(2),
  warehouseType: z.enum(['RAW_MATERIAL', 'WIP', 'FINISHED_GOODS', 'SILO', 'PACKAGING', 'REJECT', 'QUARANTINE']).default('RAW_MATERIAL'),
  location: z.string().optional(),
  capacity: z.number().optional(),
  capacityUom: z.string().default('KG'),
  isTemperatureControlled: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateWarehouseDto = z.infer<typeof CreateWarehouseDtoSchema>;

export const CreateLocationDtoSchema = z.object({
  locationCode: z.string().min(2),
  locationName: z.string().min(2),
  zone: z.string().optional(),
  rack: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
  capacity: z.number().optional(),
  isAvailable: z.boolean().default(true),
});
export type CreateLocationDto = z.infer<typeof CreateLocationDtoSchema>;

// ==========================================
// SCREEN 9: MACHINE & WORK CENTERS
// ==========================================
export const CreateMachineDtoSchema = z.object({
  id: z.string().optional(),
  plantId: z.string().min(1),
  machineCode: z.string().min(2),
  machineName: z.string().min(2),
  machineType: z.enum(['IMM', 'BLOW_MOLDING', 'EXTRUSION', 'SECONDARY', 'ASSEMBLY', 'PACKAGING', 'TESTING']).default('IMM'),
  manufacturer: z.string().optional(),
  yearOfMfg: z.number().int().optional(),
  tonnage: z.number().positive().default(250),
  cavityCapacity: z.number().int().default(4),
  cycleTimeSec: z.number().default(15.0),
  powerRating: z.number().default(45),
  status: z.enum(['AVAILABLE', 'RUNNING', 'MAINTENANCE', 'BREAKDOWN', 'SETUP', 'IDLE', 'DECOMMISSIONED']).default('AVAILABLE'),
  isOperational: z.boolean().default(true),
});
export type CreateMachineDto = z.infer<typeof CreateMachineDtoSchema>;

export const CreateMoldDtoSchema = z.object({
  id: z.string().optional(),
  machineId: z.string().optional(),
  moldCode: z.string().min(2),
  moldName: z.string().min(2),
  moldType: z.string().default('INJECTION'),
  cavityCount: z.number().int().default(1),
  shotWeight: z.number().default(450),
  material: z.string().default('P20 Steel'),
  status: z.string().default('AVAILABLE'),
});
export type CreateMoldDto = z.infer<typeof CreateMoldDtoSchema>;

// ==========================================
// SCREEN 10: SHIFT & WORKING CALENDAR
// ==========================================
export const CreateShiftDtoSchema = z.object({
  id: z.string().optional(),
  shiftCode: z.string().min(2),
  shiftName: z.string().min(2),
  startTime: z.string().default('06:00'),
  endTime: z.string().default('14:00'),
  durationHours: z.number().default(8.0),
  breakMinutes: z.number().int().default(30),
  isActive: z.boolean().default(true),
});
export type CreateShiftDto = z.infer<typeof CreateShiftDtoSchema>;

export const MarkHolidayDtoSchema = z.object({
  date: z.string().min(1),
  holidayName: z.string().min(2),
  isWorkingDay: z.boolean().default(false),
  notes: z.string().optional(),
});
export type MarkHolidayDto = z.infer<typeof MarkHolidayDtoSchema>;

// ==========================================
// SCREEN 11: REASON CODES
// ==========================================
export const CreateReasonCodeDtoSchema = z.object({
  id: z.string().optional(),
  codeCategory: z.enum(['DOWNTIME', 'REJECTION', 'DELAY', 'QUALITY', 'SAFETY', 'MAINTENANCE', 'MATERIAL', 'CUSTOM']).default('DOWNTIME'),
  reasonCode: z.string().min(2),
  reasonDescription: z.string().min(2),
  isActive: z.boolean().default(true),
  isOeeImpact: z.boolean().default(true),
});
export type CreateReasonCodeDto = z.infer<typeof CreateReasonCodeDtoSchema>;

// ==========================================
// SCREEN 12: NUMBER SEQUENCES
// ==========================================
export const CreateNumberSequenceDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  module: z.string().min(1).default('Procurement'),
  documentType: z.string().min(1).default('Purchase Order'),
  sequenceCode: z.string().min(1).default('PO_SEQ'),
  sequenceName: z.string().min(1).default('PO Sequence'),
  prefix: z.string().default('PO-2026-'),
  suffix: z.string().default(''),
  currentNumber: z.number().int().default(1),
  nextNumber: z.number().int().default(1),
  paddingLength: z.number().int().default(5),
  resetFrequency: z.enum(['DAILY', 'MONTHLY', 'YEARLY', 'NEVER', 'Never', 'Yearly', 'Monthly']).default('YEARLY'),
  isActive: z.boolean().default(true),
});
export type CreateNumberSequenceDto = z.infer<typeof CreateNumberSequenceDtoSchema>;

// ==========================================
// SCREEN 13: NOTIFICATION RULES
// ==========================================
export const CreateNotificationRuleDtoSchema = z.object({
  ruleCode: z.string().min(2),
  ruleName: z.string().min(2),
  eventType: z.string().min(2),
  triggerCondition: z.record(z.string(), z.any()).default({}),
  channels: z.array(z.string()).default(['IN_APP', 'EMAIL']),
  recipients: z.array(z.string()).default(['ROLE-ADMIN']),
  templateId: z.string().optional(),
  priority: z.number().int().default(10),
  isActive: z.boolean().default(true),
});
export type CreateNotificationRuleDto = z.infer<typeof CreateNotificationRuleDtoSchema>;

export const TestRuleDtoSchema = z.object({
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.any()).default({}),
});
export type TestRuleDto = z.infer<typeof TestRuleDtoSchema>;

// ==========================================
// SCREEN 14: MASTER DATA GOVERNANCE
// ==========================================
export const CreateGovernanceRuleDtoSchema = z.object({
  ruleCode: z.string().min(2),
  ruleName: z.string().min(2),
  entityType: z.string().min(2),
  ruleType: z.enum(['VALIDATION', 'APPROVAL', 'RESTRICTION', 'NOTIFICATION']).default('VALIDATION'),
  condition: z.record(z.string(), z.any()).default({}),
  action: z.string().default('REQUIRE_APPROVAL'),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).default('WARNING'),
  isActive: z.boolean().default(true),
});
export type CreateGovernanceRuleDto = z.infer<typeof CreateGovernanceRuleDtoSchema>;

// ==========================================
// SCREEN 15: DOCUMENT MANAGEMENT
// ==========================================
export const CreateDocumentDtoSchema = z.object({
  documentCode: z.string().min(2),
  documentName: z.string().min(2),
  documentType: z.enum(['SOP', 'CERTIFICATE', 'MANUAL', 'DRAWING', 'REPORT', 'POLICY', 'FORM', 'OTHER']).default('SOP'),
  category: z.string().optional(),
  fileUrl: z.string().optional().default('/uploads/sop-doc.pdf'),
  fileSize: z.number().int().optional().default(102400),
  mimeType: z.string().optional().default('application/pdf'),
  expiryDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type CreateDocumentDto = z.infer<typeof CreateDocumentDtoSchema>;

// ==========================================
// SCREEN 17: EMAIL & SMTP CONFIGURATION
// ==========================================
export const CreateEmailConfigDtoSchema = z.object({
  configName: z.string().min(2),
  smtpHost: z.string().min(2),
  smtpPort: z.number().int().default(587),
  smtpUser: z.string().min(1),
  smtpPassword: z.string().min(1),
  useTls: z.boolean().default(true),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  isActive: z.boolean().default(true),
});
export type CreateEmailConfigDto = z.infer<typeof CreateEmailConfigDtoSchema>;

export const TestEmailDtoSchema = z.object({
  toEmail: z.string().email(),
});
export type TestEmailDto = z.infer<typeof TestEmailDtoSchema>;

// ==========================================
// SCREEN 18: INTEGRATIONS & API KEYS
// ==========================================
export const CreateApiKeyDtoSchema = z.object({
  keyName: z.string().min(2),
  service: z.enum(['RAZORPAY', 'TWILIO', 'AWS', 'TALLY_ERP', 'CUSTOM']).default('CUSTOM'),
  permissions: z.array(z.string()).default(['READ', 'WRITE']),
  expiresAt: z.string().optional(),
});
export type CreateApiKeyDto = z.infer<typeof CreateApiKeyDtoSchema>;

// ==========================================
// SCREEN 19: BACKUP & DISASTER RECOVERY
// ==========================================
export const CreateBackupConfigDtoSchema = z.object({
  configName: z.string().min(2),
  schedule: z.string().default('0 2 * * *'), // Daily at 2 AM
  retentionDays: z.number().int().default(30),
  storageType: z.enum(['LOCAL', 'S3', 'AZURE']).default('LOCAL'),
  storagePath: z.string().default('/var/backups/reboot-erp'),
  compressData: z.boolean().default(true),
  encryptData: z.boolean().default(true),
  isActive: z.boolean().default(true),
});
export type CreateBackupConfigDto = z.infer<typeof CreateBackupConfigDtoSchema>;

// ==========================================
// SCREEN 20: LICENSE & SUBSCRIPTION
// ==========================================
export const UpdateLicenseDtoSchema = z.object({
  licenseKey: z.string().min(5),
  licenseType: z.enum(['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('ENTERPRISE'),
  maxUsers: z.number().int().default(100),
  maxPlants: z.number().int().default(5),
  maxStorageGb: z.number().default(500),
  modules: z.array(z.string()).default(['ALL']),
  startDate: z.string().default(new Date().toISOString()),
  endDate: z.string().default(new Date(Date.now() + 365 * 86400000).toISOString()),
});
export type UpdateLicenseDto = z.infer<typeof UpdateLicenseDtoSchema>;

// ==========================================
// SCREEN 21: DATA IMPORT / EXPORT
// ==========================================
export const ImportDataDtoSchema = z.object({
  jobName: z.string().min(2),
  entityType: z.enum(['ITEM_MASTER', 'SUPPLIERS', 'CUSTOMERS', 'BOM', 'WORK_ORDERS']),
  mapping: z.record(z.string(), z.string()).default({}),
});
export type ImportDataDto = z.infer<typeof ImportDataDtoSchema>;

export const ExportDataDtoSchema = z.object({
  entityType: z.string().min(1),
  format: z.enum(['CSV', 'XLSX', 'JSON']).default('CSV'),
  filters: z.record(z.string(), z.any()).default({}),
});
export type ExportDataDto = z.infer<typeof ExportDataDtoSchema>;

// ==========================================
// SCREEN 22: CUSTOM FIELDS & FORMS BUILDER
// ==========================================
export const CreateCustomFieldDtoSchema = z.object({
  entityType: z.string().min(1), // e.g. 'ItemMaster', 'WorkOrder'
  fieldCode: z.string().min(2),
  fieldName: z.string().min(2),
  fieldType: z.enum(['TEXT', 'NUMBER', 'DATE', 'DATETIME', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'EMAIL', 'PHONE', 'URL', 'FILE']).default('TEXT'),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  isSearchable: z.boolean().default(true),
  sortOrder: z.number().int().default(100),
  isActive: z.boolean().default(true),
});
export type CreateCustomFieldDto = z.infer<typeof CreateCustomFieldDtoSchema>;

// ==========================================
// SCREEN 23: SYSTEM HEALTH & TELEMETRY
// ==========================================
export const SystemHealthCheckDtoSchema = z.object({
  component: z.string().optional(),
});
export type SystemHealthCheckDto = z.infer<typeof SystemHealthCheckDtoSchema>;
