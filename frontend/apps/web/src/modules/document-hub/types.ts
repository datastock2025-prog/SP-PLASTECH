export type ReportOutputFormat = 'PDF' | 'XLSX' | 'CSV';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface CatalogParameter {
  name: string;
  type: string;
  required: boolean;
  label: string;
  options?: string[];
}

export interface ReportCatalogItem {
  id: string;
  title: string;
  category: string;
  description: string;
  supportedFormats: ReportOutputFormat[];
  parameters: CatalogParameter[];
}

export interface OeeReportFilters {
  dateFrom: string;
  dateTo: string;
  plantId?: string;
  machineId?: string;
  shiftId?: string;
  outputFormat: ReportOutputFormat;
}

export interface OeeSummary {
  period: { from: string; to: string };
  totalSlices: number;
  totalPlannedHours: number;
  totalOperatingHours: number;
  totalDowntimeHours: number;
  totalGoodQty: number;
  totalRejectedQty: number;
  totalQty: number;
  overallOeePct: number;
  averageAvailabilityPct: number;
  averagePerformancePct: number;
  averageQualityPct: number;
  topLossReasons: Array<{ reason: string; minutes: number }>;
}

export interface OeeDetailRow {
  date: string;
  plantName: string;
  machineCode: string;
  machineName: string;
  shiftCode: string;
  plannedMinutes: number;
  operatingMinutes: number;
  downtimeMinutes: number;
  goodQty: number;
  rejectedQty: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;
}

export interface OeeReportPayload {
  reportType: string;
  generatedAt: string;
  summary: OeeSummary;
  rows: OeeDetailRow[];
}

export interface DocumentJobRecord {
  id: string;
  tenantId: string;
  reportType: string;
  outputFormat: ReportOutputFormat;
  status: JobStatus;
  filters: Record<string, any>;
  rowCount?: number;
  durationMs?: number;
  errorSummary?: string;
  createdAt: string;
  completedAt?: string;
  docId?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface EnqueueJobRequest {
  reportType: 'OEE_PERFORMANCE' | 'OEE';
  filters: OeeReportFilters;
}

