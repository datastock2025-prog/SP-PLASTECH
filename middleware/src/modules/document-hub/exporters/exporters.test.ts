import { describe, it, expect } from 'vitest';
import { buildOeeReportPayload } from '../reports/oeeCalculator.js';
import { exportOeeToCsv } from './csvExporter.js';
import { exportOeeToXlsx } from './xlsxExporter.js';
import { exportOeeToPdf } from './pdfExporter.js';
import type { RawOeeProductionSlice } from '../types.js';

describe('Document Hub Multi-Format Exporters', () => {
  const dummySlices: RawOeeProductionSlice[] = [
    {
      sliceKey: '2026-10-28_ENGEL-180T_SHIFT-A',
      date: '2026-10-28',
      plantName: 'Plant 01 — Pune Hub',
      machineId: 'M-01',
      machineCode: 'ENGEL-180T',
      machineName: 'ENGEL Victory 180T',
      shiftId: 'SHIFT-A',
      shiftCode: 'SHIFT-A',
      shiftName: 'Shift A (06:00-14:00)',
      shiftPlannedMinutes: 450,
      downtimeMinutes: 30,
      shotsProduced: 750,
      goodQty: 740,
      rejectedQty: 10,
      idealCycleTimeSeconds: 28.0,
    },
    {
      sliceKey: '2026-10-28_DEMAG-500T_SHIFT-A',
      date: '2026-10-28',
      plantName: 'Plant 01 — Pune Hub',
      machineId: 'M-02',
      machineCode: 'DEMAG-500T',
      machineName: 'Demag Systec 500',
      shiftId: 'SHIFT-A',
      shiftCode: 'SHIFT-A',
      shiftName: 'Shift A (06:00-14:00)',
      shiftPlannedMinutes: 450,
      downtimeMinutes: 60,
      shotsProduced: 600,
      goodQty: 585,
      rejectedQty: 15,
      idealCycleTimeSeconds: 32.0,
    },
  ];

  const payload = buildOeeReportPayload(dummySlices, '2026-10-28', '2026-10-28');

  it('exports valid, sanitized CSV buffer', () => {
    const csvBuf = exportOeeToCsv(payload);
    expect(csvBuf).toBeDefined();
    expect(csvBuf.length).toBeGreaterThan(100);

    const str = csvBuf.toString('utf-8');
    expect(str).toContain('SP-PLASTECH ERP — Overall Equipment Effectiveness (OEE) Report');
    expect(str).toContain('ENGEL-180T');
    expect(str).toContain('DEMAG-500T');
  });

  it('exports valid XLSX workbook buffer', async () => {
    const xlsxBuf = await exportOeeToXlsx(payload);
    expect(xlsxBuf).toBeDefined();
    expect(xlsxBuf.length).toBeGreaterThan(500);
  });

  it('exports valid PDF document buffer', async () => {
    const pdfBuf = await exportOeeToPdf(payload);
    expect(pdfBuf).toBeDefined();
    expect(pdfBuf.length).toBeGreaterThan(1000);
    // PDF Magic bytes '%PDF-'
    expect(pdfBuf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
