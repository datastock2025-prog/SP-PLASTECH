import { z } from 'zod';

export const CreateExecutiveKpiInputSchema = z.object({
  kpiCategory: z.enum(['FINANCIAL', 'PRODUCTION', 'QUALITY', 'SUPPLY_CHAIN', 'MAINTENANCE', 'SAFETY', 'SUSTAINABILITY', 'HR', 'CUSTOMER']).default('PRODUCTION'),
  kpiName: z.string().trim().min(1),
  kpiValue: z.number(),
  kpiTarget: z.number().optional(),
  kpiUnit: z.string().trim().default('%'),
  period: z.string().trim().default('2026-M10'),
  year: z.number().int().min(2020),
  trend: z.enum(['UP', 'DOWN', 'STABLE']).default('STABLE'),
  plantId: z.string().trim().default('plant-01'),
});

export const UpdateExecutiveKpiInputSchema = CreateExecutiveKpiInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateSavedReportInputSchema = z.object({
  title: z.string().trim().min(1),
  reportType: z.enum(['OEE', 'QUALITY', 'FINANCIAL', 'SCM', 'CUSTOM']).default('CUSTOM'),
  createdBy: z.string().trim().default('Admin'),
  configuration: z.record(z.any()).optional(),
});
