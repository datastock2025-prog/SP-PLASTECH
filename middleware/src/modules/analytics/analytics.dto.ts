import { z } from 'zod';

export const CreateKpiSnapshotDtoSchema = z.object({
  kpiCategory: z.enum([
    'FINANCIAL',
    'PRODUCTION',
    'QUALITY',
    'SUPPLY_CHAIN',
    'MAINTENANCE',
    'SAFETY',
    'SUSTAINABILITY',
    'HR',
    'CUSTOMER',
  ]),
  kpiName: z.string().min(1),
  kpiValue: z.number(),
  kpiTarget: z.number().optional(),
  kpiUnit: z.string().default('%'),
  period: z.string().min(1),
  periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  year: z.number().int(),
  month: z.number().int().optional(),
  quarter: z.number().int().optional(),
  plantId: z.string().optional(),
  trend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),
  previousValue: z.number().optional(),
  variance: z.number().optional(),
  variancePct: z.number().optional(),
  isPublic: z.boolean().default(true),
});

export type CreateKpiSnapshotDto = z.infer<typeof CreateKpiSnapshotDtoSchema>;

export const CalculateOeeDtoSchema = z.object({
  machineId: z.string().min(1),
  plantId: z.string().min(1),
  date: z.string(),
  shift: z.string().optional(),
  plannedTime: z.number().min(0),
  operatingTime: z.number().min(0),
  downtime: z.number().min(0),
  idealCycleTime: z.number().min(0),
  actualCycleTime: z.number().min(0),
  totalCount: z.number().int().min(0),
  goodCount: z.number().int().min(0),
  defectCount: z.number().int().min(0),
  availabilityLoss: z.number().default(0),
  performanceLoss: z.number().default(0),
  qualityLoss: z.number().default(0),
});

export type CalculateOeeDto = z.infer<typeof CalculateOeeDtoSchema>;

export const DefectAnalysisDtoSchema = z.object({
  plantId: z.string().min(1),
  itemId: z.string().optional(),
  workOrderId: z.string().optional(),
  date: z.string(),
  shift: z.string().optional(),
  totalProduced: z.number().int().min(0),
  totalInspected: z.number().int().min(0),
  defectsFound: z.number().int().min(0),
  defectCategory: z.string().optional(),
  costOfPoorQuality: z.number().optional(),
});

export type DefectAnalysisDto = z.infer<typeof DefectAnalysisDtoSchema>;

export const CreateAgingSnapshotDtoSchema = z.object({
  plantId: z.string().min(1),
  warehouseId: z.string().min(1),
  itemId: z.string().min(1),
  batchNumber: z.string().optional(),
  quantity: z.number().min(0),
  unitCost: z.number().min(0),
  totalValue: z.number().min(0),
  ageDays: z.number().int().min(0),
  agingBucket: z.enum(['DAYS_0_30', 'DAYS_31_60', 'DAYS_61_90', 'DAYS_91_180', 'DAYS_180_PLUS']),
  velocity: z.number().default(0),
  turnoverRatio: z.number().default(0),
  isSlowMoving: z.boolean().default(false),
  isObsolete: z.boolean().default(false),
});

export type CreateAgingSnapshotDto = z.infer<typeof CreateAgingSnapshotDtoSchema>;

export const CreateScmSnapshotDtoSchema = z.object({
  kpiCategory: z.enum([
    'ON_TIME_DELIVERY',
    'ORDER_FULFILLMENT',
    'INVENTORY_TURNOVER',
    'SUPPLIER_PERFORMANCE',
    'LEAD_TIME',
    'COST_VARIANCE',
    'FORECAST_ACCURACY',
  ]),
  kpiName: z.string().min(1),
  kpiValue: z.number(),
  kpiTarget: z.number().optional(),
  kpiUnit: z.string().default('%'),
  period: z.string().min(1),
  periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  year: z.number().int(),
  month: z.number().int().optional(),
  quarter: z.number().int().optional(),
  plantId: z.string().optional(),
  supplierId: z.string().optional(),
  trend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),
  previousValue: z.number().optional(),
  variance: z.number().optional(),
  variancePct: z.number().optional(),
});

export type CreateScmSnapshotDto = z.infer<typeof CreateScmSnapshotDtoSchema>;

export const CreateEsgSnapshotDtoSchema = z.object({
  metricCategory: z.enum([
    'CARBON_EMISSIONS',
    'ENERGY_CONSUMPTION',
    'WATER_USAGE',
    'WASTE_GENERATION',
    'RECYCLING_RATE',
    'RENEWABLE_ENERGY',
    'SOCIAL_IMPACT',
    'GOVERNANCE',
  ]),
  metricName: z.string().min(1),
  metricValue: z.number(),
  metricUnit: z.string(),
  period: z.string().min(1),
  periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  year: z.number().int(),
  month: z.number().int().optional(),
  quarter: z.number().int().optional(),
  plantId: z.string().optional(),
  scope: z.string().optional(),
  source: z.string().optional(),
  reductionTarget: z.number().optional(),
  actualReduction: z.number().optional(),
});

export type CreateEsgSnapshotDto = z.infer<typeof CreateEsgSnapshotDtoSchema>;

export const CreateMaintenanceSnapshotDtoSchema = z.object({
  machineId: z.string().min(1),
  plantId: z.string().min(1),
  period: z.string().min(1),
  periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  year: z.number().int(),
  month: z.number().int().optional(),
  totalOperatingTime: z.number().min(0),
  numberOfFailures: z.number().int().min(0),
  mtbf: z.number().min(0),
  totalDowntime: z.number().min(0),
  numberOfRepairs: z.number().int().min(0),
  mttr: z.number().min(0),
  availability: z.number().min(0).max(100),
  maintenanceCost: z.number().default(0),
  costPerHour: z.number().default(0),
});

export type CreateMaintenanceSnapshotDto = z.infer<typeof CreateMaintenanceSnapshotDtoSchema>;

export const CreateTemplateDtoSchema = z.object({
  templateCode: z.string().min(1),
  templateName: z.string().min(1),
  templateType: z.enum(['ANALYTICS', 'OPERATIONAL', 'COMPLIANCE', 'FINANCIAL', 'CUSTOM']).default('CUSTOM'),
  category: z.string().default('General'),
  description: z.string().optional(),
  structure: z.any(),
  defaultFilters: z.any().optional(),
  defaultColumns: z.any().optional(),
  chartConfig: z.any().optional(),
  isPublic: z.boolean().default(false),
});

export type CreateTemplateDto = z.infer<typeof CreateTemplateDtoSchema>;

export const UpdateTemplateDtoSchema = CreateTemplateDtoSchema.partial();
export type UpdateTemplateDto = z.infer<typeof UpdateTemplateDtoSchema>;

export const SetPermissionsDtoSchema = z.object({
  roleId: z.string().optional(),
  plantId: z.string().optional(),
  userId: z.string().optional(),
  canView: z.boolean().default(true),
  canExport: z.boolean().default(false),
  canCustomize: z.boolean().default(false),
  canShare: z.boolean().default(false),
});

export type SetPermissionsDto = z.infer<typeof SetPermissionsDtoSchema>;

export const ExportDocumentDtoSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']),
  filters: z.any().optional(),
  customizations: z.any().optional(),
});

export type ExportDocumentDto = z.infer<typeof ExportDocumentDtoSchema>;

export const CreateCustomReportDtoSchema = z.object({
  reportName: z.string().min(1),
  templateId: z.string().optional(),
  structure: z.any(),
  filters: z.any(),
  columns: z.any(),
  chartConfig: z.any().optional(),
  schedule: z.any().optional(),
  isPublic: z.boolean().default(false),
});

export type CreateCustomReportDto = z.infer<typeof CreateCustomReportDtoSchema>;

export const SetCacheDtoSchema = z.object({
  key: z.string().min(1),
  cacheType: z.string().default('KPI'),
  data: z.any(),
  filters: z.any().optional(),
  ttlSeconds: z.number().default(300),
});

export type SetCacheDto = z.infer<typeof SetCacheDtoSchema>;
