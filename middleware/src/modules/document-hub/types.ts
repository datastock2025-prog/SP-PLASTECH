import { z } from 'zod';

export const OeeReportFilterSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  plantId: z.string().uuid().optional(),
  machineId: z.string().optional(),
  shiftId: z.string().optional(),
  outputFormat: z.enum(['PDF', 'XLSX', 'CSV']).default('PDF'),
});

export type OeeReportFilters = z.infer<typeof OeeReportFilterSchema>;

export interface RawOeeProductionSlice {
  sliceKey: string;
  date: string;
  plantId?: string;
  plantName?: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  shiftId: string;
  shiftCode: string;
  shiftName: string;
  shiftPlannedMinutes: number;
  downtimeMinutes: number;
  shotsProduced: number;
  goodQty: number;
  rejectedQty: number;
  idealCycleTimeSeconds: number;
}

export interface CalculatedOeeRecord {
  sliceKey: string;
  date: string;
  plantName: string;
  machineCode: string;
  machineName: string;
  shiftName: string;
  plannedMinutes: number;
  downtimeMinutes: number;
  operatingMinutes: number;
  shotsProduced: number;
  goodQty: number;
  rejectedQty: number;
  totalQty: number;
  availability: number; // 0.0 - 1.0
  performance: number;  // 0.0 - 1.0
  quality: number;      // 0.0 - 1.0
  oee: number;          // 0.0 - 1.0
  availabilityPct: number; // 0.0 - 100.0%
  performancePct: number;
  qualityPct: number;
  oeePct: number;
}

export interface OeeReportSummary {
  period: {
    from: string;
    to: string;
  };
  totalSlices: number;
  totalPlannedHours: number;
  totalOperatingHours: number;
  totalDowntimeHours: number;
  totalGoodQty: number;
  totalRejectedQty: number;
  totalQty: number;
  averageAvailabilityPct: number;
  averagePerformancePct: number;
  averageQualityPct: number;
  overallOeePct: number;
}

export interface OeeReportPayload {
  summary: OeeReportSummary;
  rows: CalculatedOeeRecord[];
  generatedAt: string;
}

