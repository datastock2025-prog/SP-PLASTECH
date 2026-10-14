import { describe, it, expect } from 'vitest';
import {
  ExecutiveKpiSchema,
  CreateExecutiveKpiInputSchema,
  UpdateExecutiveKpiInputSchema,
  OeeRecordSchema,
  SavedReportSchema,
  ChatMessageSchema,
} from '@/packages/contracts/analytics';

describe('Analytics Module Contracts & Validation', () => {
  it('validates a valid ExecutiveKpiSchema payload', () => {
    const rawKpi = {
      id: 'kpi-uuid-001',
      kpiCategory: 'PRODUCTION' as const,
      kpiName: 'Overall Plant OEE - Sanand Injection Molding',
      kpiValue: 84.6,
      kpiTarget: 85.0,
      kpiUnit: '%',
      period: '2026-M10',
      periodType: 'MONTHLY' as const,
      year: 2026,
      trend: 'UP' as const,
      plantId: 'plant-01',
      version: 1,
    };

    const parsed = ExecutiveKpiSchema.safeParse(rawKpi);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kpiName).toBe('Overall Plant OEE - Sanand Injection Molding');
      expect(parsed.data.kpiValue).toBe(84.6);
      expect(parsed.data.trend).toBe('UP');
    }
  });

  it('rejects a KPI without name or with year before 2020', () => {
    const invalid = {
      kpiName: '',
      kpiValue: 50,
      year: 2018,
    };

    const parsed = ExecutiveKpiSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateExecutiveKpiInputSchema with OCC version check', () => {
    const update = {
      kpiValue: 86.2,
      trend: 'UP' as const,
      version: 3,
    };

    const parsed = UpdateExecutiveKpiInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(3);
      expect(parsed.data.kpiValue).toBe(86.2);
    }
  });

  it('validates an OeeRecordSchema payload', () => {
    const rawOee = {
      id: 'oee-uuid-001',
      machineId: 'IMM-250T-01',
      plantId: 'plant-01',
      date: '2026-10-13',
      availability: 92.5,
      performance: 94.0,
      quality: 98.8,
      oee: 85.9,
    };

    const parsed = OeeRecordSchema.safeParse(rawOee);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.machineId).toBe('IMM-250T-01');
      expect(parsed.data.oee).toBe(85.9);
      expect(parsed.data.quality).toBe(98.8);
    }
  });

  it('validates a SavedReportSchema payload', () => {
    const rawReport = {
      id: 'report-uuid-001',
      title: 'Q3 Machine Downtime & Pareto Analysis',
      reportType: 'OEE' as const,
      createdBy: 'Operations Director',
      configuration: {
        plantId: 'plant-01',
        includeLossPareto: true,
      },
    };

    const parsed = SavedReportSchema.safeParse(rawReport);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('Q3 Machine Downtime & Pareto Analysis');
      expect(parsed.data.reportType).toBe('OEE');
    }
  });

  it('validates a ChatMessageSchema payload', () => {
    const rawMsg = {
      id: 'msg-uuid-001',
      role: 'assistant' as const,
      content: 'Current plant OEE across 8 active IMM machines is 84.6%, which is within 0.4% of the monthly target.',
      timestamp: '2026-10-13T07:15:00Z',
    };

    const parsed = ChatMessageSchema.safeParse(rawMsg);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.role).toBe('assistant');
      expect(parsed.data.content).toContain('84.6%');
    }
  });
});
