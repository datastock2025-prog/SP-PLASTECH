import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { jitScheduleDataService } from '../../src/services/planning/jitScheduleDataService';
import { PlannedMachineJob, MachineMaster, ItemMaster } from '../../src/services/planning/jitScheduleDataService';

describe('JIT Scheduling Characterization Tests', () => {
  it('preserves groupJobsIntoSchedules, planned hours, and shortage calculations', () => {
    const testJobs: PlannedMachineJob[] = [
      {
        id: 'JOB-01',
        planDate: '2026-10-01',
        scheduleNumber: 'SCH-20261001-01',
        machineId: 'IMM-250T-01',
        itemCode: 'FG-001',
        shift: 'Shift A',
        plantName: 'Plant 1 - Pimpri Auto-Hub',
        plannedHours: 7.5,
        calculatedPcs: 1200,
        status: 'Released',
      },
      {
        id: 'JOB-02',
        planDate: '2026-10-01',
        scheduleNumber: 'SCH-20261001-01',
        machineId: 'IMM-250T-02',
        itemCode: 'FG-002',
        shift: 'Shift A',
        plantName: 'Plant 1 - Pimpri Auto-Hub',
        plannedHours: 6.0,
        calculatedPcs: 800,
        status: 'Draft',
      },
    ];

    const testMachines: MachineMaster[] = [
      { id: 'IMM-250T-01', name: 'Engel 250T', tonnage: 250, plant: 'Plant 1' } as any,
      { id: 'IMM-250T-02', name: 'Toshiba 180T', tonnage: 180, plant: 'Plant 1' } as any,
    ];

    const testItems: ItemMaster[] = [
      { code: 'FG-001', name: 'Automotive Housing', stock: '500', avail: '500' } as any,
      { code: 'FG-002', name: 'Bezel Trim', stock: '200', avail: '200' } as any,
    ];

    const schedules = jitScheduleDataService.groupJobsIntoSchedules(
      testJobs,
      testMachines,
      testItems,
      [],
      [],
      [],
      '2026-10-01'
    );

    const snapshot = {
      schedules: schedules.map((s) => ({
        scheduleNumber: s.scheduleNumber,
        planDate: s.planDate,
        totalPlannedHours: s.totalPlannedHours,
        totalTargetPcs: s.totalTargetPcs,
        releasedCount: s.releasedCount,
        hasShortage: s.hasShortage,
      })),
    };

    const goldenDir = path.resolve(process.cwd(), 'tests/golden');
    if (!fs.existsSync(goldenDir)) {
      fs.mkdirSync(goldenDir, { recursive: true });
    }
    const goldenFile = path.join(goldenDir, 'jit-scheduling.json');

    if (!fs.existsSync(goldenFile)) {
      fs.writeFileSync(goldenFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    }

    const expected = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));
    expect(snapshot).toEqual(expected);
  });
});
