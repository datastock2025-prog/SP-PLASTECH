import { describe, it, expect } from 'vitest';
import { calculateOeeSlice, buildOeeReportPayload } from './oeeCalculator.js';
import type { RawOeeProductionSlice } from '../types.js';

describe('OEE Calculation Engine (ISO 22400 / SEMI E10)', () => {
  it('correctly calculates normal production slice', () => {
    const slice: RawOeeProductionSlice = {
      sliceKey: '2026-10-28_M-01_SHIFT-A',
      date: '2026-10-28',
      machineId: 'M-01',
      machineCode: 'ENGEL-180T',
      machineName: 'ENGEL Victory 180T Press',
      shiftId: 'SHIFT-A',
      shiftCode: 'SHIFT-A',
      shiftName: 'Shift A (06:00 - 14:00)',
      shiftPlannedMinutes: 480, // 8 hours
      downtimeMinutes: 48,     // 10% downtime
      shotsProduced: 800,
      goodQty: 780,
      rejectedQty: 20,
      idealCycleTimeSeconds: 30, // 800 shots * 30s = 24,000s ideal
    };

    const res = calculateOeeSlice(slice);

    // Planned = 480 min, Downtime = 48 min, Operating = 432 min (25,920 sec)
    // Availability = 432 / 480 = 0.90 (90%)
    expect(res.availabilityPct).toBe(90);

    // Performance = 24,000s / 25,920s = 0.9259 (92.59%)
    expect(res.performancePct).toBe(92.59);

    // Quality = 780 / 800 = 0.975 (97.5%)
    expect(res.qualityPct).toBe(97.5);

    // OEE = 0.90 * 0.9259 * 0.975 = 0.8125 (81.25%)
    expect(res.oeePct).toBe(81.25);
  });

  it('handles complete downtime gracefully (Availability = 0%, Performance = 0%)', () => {
    const slice: RawOeeProductionSlice = {
      sliceKey: '2026-10-28_M-02_SHIFT-B',
      date: '2026-10-28',
      machineId: 'M-02',
      machineCode: 'DEMAG-500T',
      machineName: 'Demag Systec 500',
      shiftId: 'SHIFT-B',
      shiftCode: 'SHIFT-B',
      shiftName: 'Shift B',
      shiftPlannedMinutes: 480,
      downtimeMinutes: 480, // Total breakdown
      shotsProduced: 0,
      goodQty: 0,
      rejectedQty: 0,
      idealCycleTimeSeconds: 25,
    };

    const res = calculateOeeSlice(slice);

    expect(res.availabilityPct).toBe(0);
    expect(res.performancePct).toBe(0);
    expect(res.oeePct).toBe(0);
  });

  it('handles 100% rejection rate correctly (Quality = 0%)', () => {
    const slice: RawOeeProductionSlice = {
      sliceKey: '2026-10-28_M-03_SHIFT-C',
      date: '2026-10-28',
      machineId: 'M-03',
      machineCode: 'TOSHIBA-350T',
      machineName: 'Toshiba 350T',
      shiftId: 'SHIFT-C',
      shiftCode: 'SHIFT-C',
      shiftName: 'Shift C',
      shiftPlannedMinutes: 480,
      downtimeMinutes: 0,
      shotsProduced: 500,
      goodQty: 0,
      rejectedQty: 500,
      idealCycleTimeSeconds: 40,
    };

    const res = calculateOeeSlice(slice);

    expect(res.availabilityPct).toBe(100);
    expect(res.qualityPct).toBe(0);
    expect(res.oeePct).toBe(0);
  });

  it('computes weighted summary KPIs across multiple shifts and machines', () => {
    const s1: RawOeeProductionSlice = {
      sliceKey: 'S1',
      date: '2026-10-28',
      machineId: 'M1',
      machineCode: 'M1',
      machineName: 'Machine 1',
      shiftId: 'S1',
      shiftCode: 'S1',
      shiftName: 'Shift 1',
      shiftPlannedMinutes: 480,
      downtimeMinutes: 48,
      shotsProduced: 800,
      goodQty: 800,
      rejectedQty: 0,
      idealCycleTimeSeconds: 30,
    };

    const s2: RawOeeProductionSlice = {
      sliceKey: 'S2',
      date: '2026-10-28',
      machineId: 'M2',
      machineCode: 'M2',
      machineName: 'Machine 2',
      shiftId: 'S1',
      shiftCode: 'S1',
      shiftName: 'Shift 1',
      shiftPlannedMinutes: 480,
      downtimeMinutes: 96,
      shotsProduced: 600,
      goodQty: 570,
      rejectedQty: 30,
      idealCycleTimeSeconds: 30,
    };

    const payload = buildOeeReportPayload([s1, s2], '2026-10-28', '2026-10-28');

    expect(payload.summary.totalPlannedHours).toBe(16); // 960 min = 16 hours
    expect(payload.summary.totalDowntimeHours).toBe(2.4); // 144 min = 2.4 hours
    expect(payload.summary.totalOperatingHours).toBe(13.6); // 816 min = 13.6 hours
    expect(payload.summary.totalGoodQty).toBe(1370);
    expect(payload.summary.totalRejectedQty).toBe(30);
    expect(payload.summary.totalQty).toBe(1400);
    expect(payload.summary.averageQualityPct).toBe(97.86); // 1370 / 1400
  });
});

