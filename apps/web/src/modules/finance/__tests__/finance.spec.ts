import { describe, it, expect } from 'vitest';
import {
  AccountSchema,
  CreateAccountInputSchema,
  UpdateAccountInputSchema,
  JournalEntrySchema,
  CostCenterSchema,
  FixedAssetSchema,
} from '@/packages/contracts/finance';

describe('Finance Module Contracts & Validation', () => {
  it('validates a valid AccountSchema payload', () => {
    const rawAccount = {
      id: 'acc-uuid-101',
      code: '1010',
      name: 'Cash and Cash Equivalents - SBI Current A/c',
      type: 'Asset' as const,
      category: 'Current Assets',
      balance: 1450000,
      currency: 'INR',
      active: true,
      version: 1,
    };

    const parsed = AccountSchema.safeParse(rawAccount);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('1010');
      expect(parsed.data.type).toBe('Asset');
      expect(parsed.data.balance).toBe(1450000);
    }
  });

  it('rejects an account without code or name', () => {
    const invalid = {
      code: '',
      name: '',
      type: 'Asset' as const,
    };

    const parsed = AccountSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateAccountInputSchema with OCC version check', () => {
    const update = {
      active: false,
      version: 3,
    };

    const parsed = UpdateAccountInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(3);
      expect(parsed.data.active).toBe(false);
    }
  });

  it('validates a balanced JournalEntrySchema payload', () => {
    const rawJE = {
      id: 'je-uuid-201',
      entryNumber: 'JV-2026-10-0045',
      date: '2026-10-13',
      description: 'Raw material procurement debit to inventory and credit to vendor payable',
      lines: [
        {
          accountId: 'acc-raw-mat-inventory',
          debit: 125000,
          credit: 0,
          description: 'PP Resin inward GRN-0124',
        },
        {
          accountId: 'acc-accounts-payable',
          debit: 0,
          credit: 125000,
          description: 'Indian Oil Polymers supplier liability',
        },
      ],
      status: 'posted' as const,
      version: 1,
    };

    const parsed = JournalEntrySchema.safeParse(rawJE);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.entryNumber).toBe('JV-2026-10-0045');
      expect(parsed.data.lines).toHaveLength(2);
      expect(parsed.data.status).toBe('posted');
    }
  });

  it('rejects a journal entry with fewer than 2 lines', () => {
    const invalid = {
      entryNumber: 'JV-001',
      date: '2026-10-13',
      description: 'Single leg entry is invalid',
      lines: [
        { accountId: 'acc-01', debit: 100, credit: 0 },
      ],
    };

    const parsed = JournalEntrySchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates a FixedAssetSchema payload', () => {
    const rawAsset = {
      id: 'asset-uuid-001',
      assetCode: 'FA-IMM-250T',
      name: 'Nissei 250 Ton Injection Molding Machine',
      category: 'Plant & Machinery',
      purchaseDate: '2024-03-15',
      cost: 4500000,
      depreciationRate: 15,
    };

    const parsed = FixedAssetSchema.safeParse(rawAsset);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.assetCode).toBe('FA-IMM-250T');
      expect(parsed.data.cost).toBe(4500000);
    }
  });
});
