import { describe, it, expect } from 'vitest';
import {
  BomSchema,
  BomLineSchema,
  CreateBomInputSchema,
  UpdateBomInputSchema,
  EcrSchema,
} from '@/packages/contracts/engineering';

describe('Engineering Module Contracts & Validation', () => {
  it('validates a valid BomLineSchema payload', () => {
    const rawLine = {
      itemCode: 'RM-PP-001',
      description: 'Polypropylene Resin Granules',
      quantity: 1.05,
      uom: 'KG',
      scrapFactor: 2.5,
      unitCost: 110,
    };

    const parsed = BomLineSchema.safeParse(rawLine);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.itemCode).toBe('RM-PP-001');
      expect(parsed.data.quantity).toBe(1.05);
    }
  });

  it('rejects a BomLine with non-positive quantity', () => {
    const invalid = {
      itemCode: 'RM-PP-001',
      quantity: -1,
      uom: 'KG',
    };

    const parsed = BomLineSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates a valid BomSchema with multi-level components', () => {
    const rawBom = {
      code: 'BOM-CHAIR-001',
      itemCode: 'FG-CHAIR-ARM-01',
      version: 'v2.1',
      yieldPercent: 98.5,
      status: 'active' as const,
      lines: [
        {
          itemCode: 'RM-PP-001',
          description: 'Polypropylene Granules',
          quantity: 2.3,
          uom: 'KG',
        },
        {
          itemCode: 'MB-BLK-01',
          description: 'Black Masterbatch',
          quantity: 0.05,
          uom: 'KG',
        },
      ],
      versionNumber: 2,
    };

    const parsed = BomSchema.safeParse(rawBom);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('BOM-CHAIR-001');
      expect(parsed.data.lines).toHaveLength(2);
    }
  });

  it('validates an UpdateBomInputSchema with required versionNumber', () => {
    const update = {
      yieldPercent: 99.0,
      versionNumber: 3,
    };

    const parsed = UpdateBomInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.versionNumber).toBe(3);
    }
  });

  it('validates an EcrSchema payload', () => {
    const rawEcr = {
      ecrNumber: 'ECR-2026-0042',
      title: 'Reduce wall thickness on mold cavity 2',
      itemCode: 'FG-CHAIR-ARM-01',
      status: 'SUBMITTED' as const,
      priority: 'HIGH' as const,
      description: 'Cycle time optimization from 32s to 28s',
      requestedBy: 'user-eng-lead-01',
    };

    const parsed = EcrSchema.safeParse(rawEcr);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ecrNumber).toBe('ECR-2026-0042');
      expect(parsed.data.priority).toBe('HIGH');
    }
  });
});
