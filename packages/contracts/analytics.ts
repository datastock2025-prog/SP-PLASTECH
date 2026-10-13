import { z } from 'zod';

export const KpiCategoryEnum = z.enum([
  'FINANCIAL',
  'PRODUCTION',
  'QUALITY',
  'SUPPLY_CHAIN',
  'MAINTENANCE',
  'SAFETY',
  'SUSTAINABILITY',
  'HR',
  'CUSTOMER',
]);

export const PeriodTypeEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
]);

export const ExecutiveKpiSchema = z.object({
  id: z.string().optional(),
  kpiCategory: KpiCategoryEnum.default('PRODUCTION'),
  kpiName: z.string().min(1, 'KPI name is required'),
  kpiValue: z.number(),
  kpiTarget: z.number().optional(),
  kpiUnit: z.string().default('%'),
  period: z.string().default('2026-M10'),
  periodType: PeriodTypeEnum.default('MONTHLY'),
  year: z.number().int().min(2020),
  trend: z.enum(['UP', 'DOWN', 'STABLE']).default('STABLE'),
  plantId: z.string().default('plant-01'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateExecutiveKpiInputSchema = ExecutiveKpiSchema.omit({ id: true });
export const UpdateExecutiveKpiInputSchema = ExecutiveKpiSchema.partial().extend({
  version: z.number().int().min(1),
});

export const OeeRecordSchema = z.object({
  id: z.string().optional(),
  machineId: z.string().min(1, 'Machine ID is required'),
  plantId: z.string().default('plant-01'),
  date: z.string().min(1, 'Date is required'),
  availability: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  quality: z.number().min(0).max(100),
  oee: z.number().min(0).max(100),
});

export const SavedReportSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Report title is required'),
  reportType: z.enum(['OEE', 'QUALITY', 'FINANCIAL', 'SCM', 'CUSTOM']).default('CUSTOM'),
  createdBy: z.string().default('Admin'),
  configuration: z.record(z.any()).optional(),
});

export const ChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  content: z.string().min(1, 'Message content is required'),
  timestamp: z.string().optional(),
});

export type KpiCategory = z.infer<typeof KpiCategoryEnum>;
export type PeriodType = z.infer<typeof PeriodTypeEnum>;
export type ExecutiveKpiContract = z.infer<typeof ExecutiveKpiSchema>;
export type CreateExecutiveKpiContract = z.infer<typeof CreateExecutiveKpiInputSchema>;
export type UpdateExecutiveKpiContract = z.infer<typeof UpdateExecutiveKpiInputSchema>;
export type OeeRecordContract = z.infer<typeof OeeRecordSchema>;
export type SavedReportContract = z.infer<typeof SavedReportSchema>;
export type ChatMessageContract = z.infer<typeof ChatMessageSchema>;
