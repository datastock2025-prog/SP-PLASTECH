import { describe, it, expect } from 'vitest';
import {
  TaskSchema,
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  ApprovalSchema,
  NotificationSchema,
  SavedPresetSchema,
} from '@/packages/contracts/workspace';

describe('Workspace Module Contracts & Validation', () => {
  it('validates a valid TaskSchema payload', () => {
    const rawTask = {
      id: 'tsk-uuid-001',
      title: 'Sign off Line 02 SMED Changeover Checklist',
      module: 'Production',
      priority: 'HIGH' as const,
      due: 'Today, 2:00 PM',
      assignedBy: 'Priya Rao',
      status: 'PENDING' as const,
      view: 'changeover',
      version: 1,
    };

    const parsed = TaskSchema.safeParse(rawTask);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('Sign off Line 02 SMED Changeover Checklist');
      expect(parsed.data.module).toBe('Production');
      expect(parsed.data.priority).toBe('HIGH');
      expect(parsed.data.status).toBe('PENDING');
    }
  });

  it('rejects a task with empty title', () => {
    const invalid = {
      title: '',
      module: 'Quality',
    };

    const parsed = TaskSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateTaskInputSchema with OCC version check', () => {
    const update = {
      status: 'COMPLETED' as const,
      version: 2,
    };

    const parsed = UpdateTaskInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
      expect(parsed.data.status).toBe('COMPLETED');
    }
  });

  it('validates an ApprovalSchema payload', () => {
    const rawApproval = {
      id: 'appr-uuid-001',
      documentType: 'Purchase Requisition',
      documentNumber: 'PR-2026-00412',
      requestedBy: 'Stores Manager',
      department: 'Warehouse & Logistics',
      amount: 145000,
      currency: 'INR',
      status: 'PENDING' as const,
      submittedAt: '2026-10-13T09:00:00Z',
      version: 1,
    };

    const parsed = ApprovalSchema.safeParse(rawApproval);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.documentType).toBe('Purchase Requisition');
      expect(parsed.data.documentNumber).toBe('PR-2026-00412');
      expect(parsed.data.amount).toBe(145000);
      expect(parsed.data.status).toBe('PENDING');
    }
  });

  it('validates a NotificationSchema payload', () => {
    const rawNotif = {
      id: 'notif-uuid-001',
      title: 'Quarantine Lot Released',
      message: 'Resin Lot LOT-2026-00123 has been released to active inventory.',
      type: 'SUCCESS' as const,
      read: false,
      timestamp: '2026-10-13T10:15:00Z',
      actionUrl: '/warehouse/quarantine',
    };

    const parsed = NotificationSchema.safeParse(rawNotif);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('Quarantine Lot Released');
      expect(parsed.data.type).toBe('SUCCESS');
      expect(parsed.data.read).toBe(false);
    }
  });

  it('validates a SavedPresetSchema payload', () => {
    const rawPreset = {
      id: 'preset-uuid-001',
      name: 'High Priority Overdue Work Orders',
      view: 'workOrders',
      filterConfig: {
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
      },
      isDefault: true,
      createdBy: 'Operations Lead',
    };

    const parsed = SavedPresetSchema.safeParse(rawPreset);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('High Priority Overdue Work Orders');
      expect(parsed.data.view).toBe('workOrders');
      expect(parsed.data.isDefault).toBe(true);
    }
  });
});
