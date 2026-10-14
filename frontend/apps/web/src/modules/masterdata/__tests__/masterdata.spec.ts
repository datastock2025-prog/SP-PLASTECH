import { describe, it, expect } from 'vitest';
import { ItemSchema, UpdateItemSchema } from '@/packages/contracts/masterdata';

describe('MasterData Module Contracts & Validation', () => {
  it('validates a valid ItemSchema payload', () => {
    const raw = {
      code: 'RM-PP-NAT-001',
      name: 'Polypropylene Homopolymer Natural',
      category: 'Raw Material',
      type: 'Raw Material',
      uom: 'KG',
      costPrice: 95.5,
      sellingPrice: 110,
      minStock: 500,
      maxStock: 5000,
      reorderPoint: 1000,
      safetyStock: 300,
      isBatchTracked: true,
      partWeightGrams: 0,
      runnerWeightGrams: 0,
      cavityCount: 1,
      cycleTimeSeconds: 0,
      version: 1,
    };

    const parsed = ItemSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('RM-PP-NAT-001');
      expect(parsed.data.uom).toBe('KG');
    }
  });

  it('rejects invalid item code with illegal characters', () => {
    const invalid = {
      code: 'INVALID CODE WITH SPACES!@#',
      name: 'Test Item',
      category: 'Raw Material',
      uom: 'KG',
    };

    const parsed = ItemSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateItemSchema with version check', () => {
    const update = {
      name: 'Updated Name',
      costPrice: 105.0,
      version: 2,
    };

    const parsed = UpdateItemSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
    }
  });
});
