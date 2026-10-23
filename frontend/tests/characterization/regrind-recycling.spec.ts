import '../setup';
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { regrindMaterialService } from '../../src/services/regrindMaterialService';
import { WorkOrder, ItemMaster } from '../../src/types';

describe('Regrind Material Recycling Characterization Tests', () => {
  it('preserves scrap aggregation, runner, lumps, and pending RG calculations', () => {
    const testWorkOrders: WorkOrder[] = [
      {
        id: 'WO-2026-TEST1',
        item: 'FG-AUTO-012',
        machine: 'IMM-250T-01',
        shift: 'Shift A',
        planDate: '2026-09-29',
        targetQty: 5000,
        producedQty: 4800,
        goodQty: 4700,
        rejectionQty: 100,
        status: 'In Progress',
        uom: 'PCS',
        plant: 'Plant 1',
        runnerQty: 14.4,
        lumpsQty: 3.2,
      } as any,
    ];

    const testItems: ItemMaster[] = [
      {
        code: 'FG-AUTO-012',
        name: 'ABS Dashboard Trim Bezel',
        partWeightGrams: 45,
        runnerWeightGrams: 12,
        shotWeightGrams: 57,
        cavityCount: 4,
      } as any,
    ];

    const scrapSummary = regrindMaterialService.calculateWoScrapConsolidated(testWorkOrders, testItems, []);

    const snapshot = {
      scrapSummary,
    };

    const goldenDir = path.resolve(process.cwd(), 'tests/golden');
    if (!fs.existsSync(goldenDir)) {
      fs.mkdirSync(goldenDir, { recursive: true });
    }
    const goldenFile = path.join(goldenDir, 'regrind-recycling.json');

    if (!fs.existsSync(goldenFile)) {
      fs.writeFileSync(goldenFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    }

    const expected = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));
    expect(snapshot).toEqual(expected);
  });
});
