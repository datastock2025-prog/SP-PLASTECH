import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  computeConsolidatedBomExplosion,
  computePlantBomExplosion,
  PrFinishedGoodItem,
} from '../../src/services/procurement/bomExplosionService';

describe('BOM Explosion Characterization Tests', () => {
  it('preserves exact explosion outputs for Plant 1 and Plant 2 with virgin and PCR blends', () => {
    const fgItems: PrFinishedGoodItem[] = [
      {
        itemCode: 'FG-TEST-001',
        itemName: 'Automotive Housing PA66',
        plannedQty: 10000,
        uom: 'PCS',
        selectedBomVersion: 'BOM-v1.0 (Prime Virgin Standard)',
        availableBomVersions: [],
      },
      {
        itemCode: 'FG-TEST-002',
        itemName: 'Eco Bumper Bracket',
        plannedQty: 5000,
        uom: 'PCS',
        selectedBomVersion: 'BOM-v2.1 (Eco PCR 30% Blend)',
        availableBomVersions: [],
      },
    ];

    const plant1Result = computeConsolidatedBomExplosion('Plant 1 - Pimpri Auto-Hub', fgItems);
    const plant2Result = computeConsolidatedBomExplosion('Plant 2 - Chakan Assembly', fgItems);
    const fallbackResult = computePlantBomExplosion('Plant 1', []);

    const snapshot = {
      plant1: plant1Result,
      plant2: plant2Result,
      fallback: fallbackResult,
    };

    const goldenDir = path.resolve(process.cwd(), 'tests/golden');
    if (!fs.existsSync(goldenDir)) {
      fs.mkdirSync(goldenDir, { recursive: true });
    }
    const goldenFile = path.join(goldenDir, 'bom-explosion.json');

    if (!fs.existsSync(goldenFile)) {
      fs.writeFileSync(goldenFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    }

    const expected = JSON.parse(fs.readFileSync(goldenFile, 'utf-8'));
    expect(snapshot).toEqual(expected);
  });
});
