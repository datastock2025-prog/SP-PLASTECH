import { describe, it, expect } from 'vitest';
import {
  PlannedOrderSchema,
  CreatePlannedOrderInputSchema,
  UpdatePlannedOrderInputSchema,
  MrpRunSchema,
  JitScheduleSchema,
  ShipmentTrackingSchema,
} from '@/packages/contracts/planning';

describe('Planning Module Contracts & Validation', () => {
  it('validates a valid PlannedOrderSchema payload', () => {
    const rawOrder = {
      id: 'PLN-2026-0045',
      orderNumber: 'PO-PLN-0045',
      itemCode: 'FG-BOTTLE-500ML',
      quantity: 25000,
      uom: 'PCS',
      startDate: '2026-10-15',
      dueDate: '2026-10-22',
      source: 'mrp' as const,
      status: 'planned' as const,
      version: 1,
    };

    const parsed = PlannedOrderSchema.safeParse(rawOrder);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.orderNumber).toBe('PO-PLN-0045');
      expect(parsed.data.quantity).toBe(25000);
      expect(parsed.data.source).toBe('mrp');
    }
  });

  it('rejects a planned order with non-positive quantity', () => {
    const invalid = {
      orderNumber: 'PO-PLN-0045',
      itemCode: 'FG-BOTTLE-500ML',
      quantity: 0,
      startDate: '2026-10-15',
      dueDate: '2026-10-22',
    };

    const parsed = PlannedOrderSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdatePlannedOrderInputSchema with version check', () => {
    const update = {
      status: 'confirmed' as const,
      version: 2,
    };

    const parsed = UpdatePlannedOrderInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
      expect(parsed.data.status).toBe('confirmed');
    }
  });

  it('validates an MrpRunSchema payload', () => {
    const rawRun = {
      id: 'mrp-uuid-001',
      runNumber: 'MRP-2026-W42',
      planHorizonDays: 45,
      totalPlannedOrders: 18,
      status: 'completed' as const,
      executedAt: '2026-10-13T06:00:00Z',
    };

    const parsed = MrpRunSchema.safeParse(rawRun);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.runNumber).toBe('MRP-2026-W42');
      expect(parsed.data.planHorizonDays).toBe(45);
    }
  });

  it('validates a JitScheduleSchema payload', () => {
    const rawJit = {
      id: 'jit-uuid-001',
      scheduleNumber: 'JIT-2026-10-13-A',
      machineId: 'IMM-250T-01',
      shift: 'Shift A',
      planDate: '2026-10-13',
      status: 'published' as const,
    };

    const parsed = JitScheduleSchema.safeParse(rawJit);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.scheduleNumber).toBe('JIT-2026-10-13-A');
      expect(parsed.data.machineId).toBe('IMM-250T-01');
    }
  });

  it('validates a ShipmentTrackingSchema payload', () => {
    const rawTracking = {
      trackingNumber: 'BD-882910',
      carrier: 'BlueDart Logistics',
      status: 'in_transit' as const,
      origin: 'Pune Central Works',
      destination: 'Ahmedabad Distribution Center',
    };

    const parsed = ShipmentTrackingSchema.safeParse(rawTracking);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.trackingNumber).toBe('BD-882910');
      expect(parsed.data.status).toBe('in_transit');
    }
  });
});
