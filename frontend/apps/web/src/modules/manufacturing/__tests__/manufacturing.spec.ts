import { describe, it, expect } from 'vitest';
import {
  WorkOrderSchema,
  CreateWorkOrderInputSchema,
  UpdateWorkOrderInputSchema,
  WorkOrderLogSchema,
  MachineMasterSchema,
  DailyProductionEntrySchema,
  RegrindEntrySchema,
} from '@/packages/contracts/manufacturing';

describe('Manufacturing Module Contracts & Validation', () => {
  it('validates a valid WorkOrderSchema payload', () => {
    const rawWO = {
      id: 'WO-2026-0120',
      item: 'FG-CAP-38MM-BLU',
      bomId: 'BOM-CAP-001',
      machine: 'IMM-250T-01',
      qty: 50000,
      uom: 'PCS',
      completed: 12000,
      scrap: 240,
      status: 'in_progress' as const,
      priority: 'High' as const,
      dueDate: '2026-10-20',
      operator: 'Rajesh K',
      shift: 'Shift A',
      version: 1,
    };

    const parsed = WorkOrderSchema.safeParse(rawWO);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('WO-2026-0120');
      expect(parsed.data.qty).toBe(50000);
      expect(parsed.data.status).toBe('in_progress');
    }
  });

  it('rejects a work order with non-positive quantity', () => {
    const invalid = {
      item: 'FG-CAP-38MM',
      qty: -100,
      dueDate: '2026-10-20',
    };

    const parsed = WorkOrderSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateWorkOrderInputSchema with version check', () => {
    const update = {
      status: 'completed' as const,
      completed: 50000,
      version: 4,
    };

    const parsed = UpdateWorkOrderInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(4);
      expect(parsed.data.status).toBe('completed');
    }
  });

  it('validates a WorkOrderLogSchema shift entry', () => {
    const rawLog = {
      workOrderId: 'WO-2026-0120',
      goodQty: 4500,
      scrapQty: 65,
      operator: 'Sunil Verma',
      shift: 'Shift B',
      machineId: 'IMM-250T-01',
      reasonCode: 'DEF-FLASH',
    };

    const parsed = WorkOrderLogSchema.safeParse(rawLog);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.goodQty).toBe(4500);
      expect(parsed.data.operator).toBe('Sunil Verma');
    }
  });

  it('validates a MachineMasterSchema payload', () => {
    const rawMachine = {
      id: 'mach-uuid-001',
      code: 'IMM-180T-02',
      name: 'Toshiba 180 Ton All-Electric',
      type: 'Injection Molding Machine' as const,
      line: 'Bay 2 - Precision Line',
      status: 'running' as const,
      tonnage: '180T',
      hourlyRate: 1400,
    };

    const parsed = MachineMasterSchema.safeParse(rawMachine);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Toshiba 180 Ton All-Electric');
      expect(parsed.data.status).toBe('running');
    }
  });

  it('validates a RegrindEntrySchema payload', () => {
    const rawRegrind = {
      id: 'regrind-uuid-001',
      workOrderId: 'WO-2026-0120',
      itemCode: 'RM-PP-001',
      regrindWeightKg: 15.5,
      virginWeightKg: 84.5,
      ratioPct: 15.5,
    };

    const parsed = RegrindEntrySchema.safeParse(rawRegrind);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.regrindWeightKg).toBe(15.5);
      expect(parsed.data.ratioPct).toBe(15.5);
    }
  });
});
