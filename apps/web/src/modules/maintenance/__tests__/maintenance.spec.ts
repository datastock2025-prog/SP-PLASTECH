import { describe, it, expect } from 'vitest';
import {
  MaintenanceWorkOrderSchema,
  CreateMaintenanceWorkOrderInputSchema,
  UpdateMaintenanceWorkOrderInputSchema,
  EquipmentAssetSchema,
  MeterReadingSchema,
  MepAlarmSchema,
} from '@/packages/contracts/maintenance';

describe('Maintenance Module Contracts & Validation', () => {
  it('validates a valid MaintenanceWorkOrderSchema payload', () => {
    const rawWo = {
      id: 'mwo-uuid-001',
      workOrderNumber: 'MWO-2026-10-001',
      title: 'Quarterly Chiller Condenser Tube Descaling',
      equipmentId: 'MEP-CHILL-01',
      equipmentName: 'Central Water-Cooled Chiller #1',
      category: 'Mechanical' as const,
      type: 'Preventative (PM)' as const,
      priority: 'High' as const,
      status: 'Assigned' as const,
      assignedTo: 'Vikram Sharma',
      dueDate: '2026-10-25',
      estimatedHours: 4,
      actualHours: 0,
      permitRequired: true,
      permitType: 'LOTO (Lockout/Tagout)' as const,
      version: 1,
    };

    const parsed = MaintenanceWorkOrderSchema.safeParse(rawWo);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.workOrderNumber).toBe('MWO-2026-10-001');
      expect(parsed.data.category).toBe('Mechanical');
      expect(parsed.data.estimatedHours).toBe(4);
      expect(parsed.data.permitRequired).toBe(true);
    }
  });

  it('rejects a maintenance work order without title or due date', () => {
    const invalid = {
      workOrderNumber: 'MWO-001',
      title: '',
      equipmentId: 'EQ-01',
      dueDate: '',
    };

    const parsed = MaintenanceWorkOrderSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateMaintenanceWorkOrderInputSchema with OCC version check', () => {
    const update = {
      status: 'In Progress' as const,
      actualHours: 2.5,
      version: 2,
    };

    const parsed = UpdateMaintenanceWorkOrderInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
      expect(parsed.data.status).toBe('In Progress');
      expect(parsed.data.actualHours).toBe(2.5);
    }
  });

  it('validates an EquipmentAssetSchema payload', () => {
    const rawAsset = {
      id: 'eq-uuid-101',
      assetCode: 'MEP-CHILL-01',
      name: 'Central Water-Cooled Chiller #1',
      category: 'Mechanical' as const,
      subSystem: 'Chilled Water & Cooling',
      location: 'Utility Building - Ground Floor',
      status: 'Running' as const,
      capacity: '250 TR (879 kW)',
      currentLoadPct: 74,
      powerRatingKw: 172,
      healthScore: 94,
      lastPmDate: '2026-07-15',
      nextPmDue: '2026-09-15',
      runningHours: 14280,
      manufacturer: 'Carrier',
      model: 'AquaEdge 19DV-250',
      version: 1,
    };

    const parsed = EquipmentAssetSchema.safeParse(rawAsset);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.assetCode).toBe('MEP-CHILL-01');
      expect(parsed.data.healthScore).toBe(94);
      expect(parsed.data.status).toBe('Running');
    }
  });

  it('validates a MeterReadingSchema payload', () => {
    const rawMeter = {
      id: 'meter-001',
      meterId: 'EM-GRID-01',
      name: 'HT Main Incomer Panel (33kV/415V)',
      zone: 'Main Substation',
      activePowerKw: 485.2,
      powerFactor: 0.98,
      todayKwh: 3840,
      status: 'normal' as const,
    };

    const parsed = MeterReadingSchema.safeParse(rawMeter);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.meterId).toBe('EM-GRID-01');
      expect(parsed.data.powerFactor).toBe(0.98);
      expect(parsed.data.status).toBe('normal');
    }
  });

  it('validates an MepAlarmSchema payload', () => {
    const rawAlarm = {
      id: 'alarm-001',
      equipmentId: 'MEP-CHILL-01',
      equipmentName: 'Central Chiller #1',
      severity: 'Major' as const,
      title: 'High Evaporator Approach Temperature',
      desc: 'Evaporator approach delta exceeded 3.2°C limit',
      status: 'Active' as const,
      actionRequired: 'Inspect chilled water loop flow rate',
    };

    const parsed = MepAlarmSchema.safeParse(rawAlarm);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.severity).toBe('Major');
      expect(parsed.data.status).toBe('Active');
    }
  });
});
