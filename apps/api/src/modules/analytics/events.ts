export interface KpiThresholdBreachedEvent {
  kpiName: string;
  currentValue: number;
  targetValue: number;
  plantId: string;
  tenantId: string;
  occurredAt: string;
}

export interface ReportExportedEvent {
  reportId: string;
  format: 'PDF' | 'EXCEL' | 'CSV';
  exportedBy: string;
  tenantId: string;
  occurredAt: string;
}
