import '../setup';
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { masterDataGovernanceService } from '../../src/services/masterDataGovernanceService';
import { mapDbRowToItemMaster } from '../../src/shared/utils/dtoMappers';

describe('Master Data Governance Characterization Tests', () => {
  it('preserves resin formula balance verification and linked recipe hash generation', () => {
    const balancedComponents = [
      { item: 'RM-PP-01', name: 'Polypropylene Virgin', percentage: 96.5 },
      { item: 'MB-BLK-02', name: 'Black Masterbatch', percentage: 2.5 },
      { item: 'AD-UV-03', name: 'UV Stabilizer', percentage: 1.0 },
    ];

    const unbalancedComponents = [
      { item: 'RM-PP-01', name: 'Polypropylene Virgin', percentage: 80.0 },
      { item: 'MB-BLK-02', name: 'Black Masterbatch', percentage: 2.5 },
    ];

    const balancedResult = masterDataGovernanceService.generateLinkedRecipeCode('1.0', balancedComponents);
    const unbalancedResult = masterDataGovernanceService.generateLinkedRecipeCode('2.1', unbalancedComponents);

    const mappedItem = mapDbRowToItemMaster({
      code: 'ITEM-PP-TEST',
      name: 'PP Housing Cover',
      part_weight_grams: 42.5,
      runner_weight_grams: 7.25,
      cycle_time_seconds: 21.5,
      cavity_count: 2,
    });

    const snapshot = {
      balancedResult,
      unbalancedResult,
      mappedItem: {
        code: mappedItem.code,
        name: mappedItem.name,
        partWeightGrams: mappedItem.partWeightGrams,
        runnerWeightGrams: mappedItem.runnerWeightGrams,
        shotWeightGrams: mappedItem.shotWeightGrams,
        cycleTimeSec: mappedItem.cycleTimeSec,
        cavityCount: mappedItem.cavityCount,
      },
    };

    const goldenDir = path.resolve(process.cwd(), 'tests/golden');
    if (!fs.existsSync(goldenDir)) {
      fs.mkdirSync(goldenDir, { recursive: true });
    }
    const goldenFile = path.join(goldenDir, 'master-data-governance.json');

    if (!fs.existsSync(goldenFile)) {
      fs.writeFileSync(goldenFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    }

    const expected = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));
    expect(snapshot).toEqual(expected);
  });
});
