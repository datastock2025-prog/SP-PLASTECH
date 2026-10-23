import { api } from '@/src/lib/api-client';
import { Account, JournalEntry } from '@/src/types';
import { JournalEntryFormValues } from '../model/financeSchemas';

export const financeApi = {
  getAccounts: async (): Promise<Account[]> => {
    try {
      const res = await api.get<any>('/gl-accounts', {
        params: { limit: 100, sortBy: 'account_code', sortOrder: 'asc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          code: r.account_code || r.code,
          name: r.account_name || r.name,
          type: r.account_type || r.type || 'Asset',
          sub: r.account_group || r.sub || 'General',
          parent: r.parent_account_id || r.parent || null,
          balance: Number(r.current_balance || r.balance || 0),
          currency: r.currency || 'INR',
          tax: Boolean(r.tax),
          cc: Boolean(r.cc),
          status: r.is_active === false ? 'inactive' : 'active',
        }));
      }
    } catch (e) {
      console.debug('[financeApi.getAccounts] REST query notice:', e);
    }
    return [];
  },

  createAccount: async (acc: Partial<Account>): Promise<Account> => {
    const newAcc: Account = {
      code: acc.code || `ACC-${Date.now().toString().slice(-4)}`,
      name: acc.name || 'New General Account',
      type: acc.type || 'Asset',
      sub: acc.sub || 'Current Assets',
      parent: acc.parent || null,
      balance: acc.balance || 0,
      currency: acc.currency || 'INR',
      tax: acc.tax ?? false,
      cc: acc.cc ?? false,
      status: acc.status || 'active',
    };

    const payload = {
      account_code: newAcc.code,
      account_name: newAcc.name,
      account_type: newAcc.type,
      account_group: newAcc.sub,
      currency: newAcc.currency,
      opening_balance: 0,
      current_balance: newAcc.balance,
      is_active: newAcc.status === 'active',
      is_postable: true,
    };

    try {
      await api.post<any>('/gl-accounts', payload);
      return newAcc;
    } catch (e) {
      console.debug('[financeApi.createAccount] REST notice:', e);
    }

    return newAcc;
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    try {
      const res = await api.get<any>('/journal-entries', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch (e) {
      console.debug('[financeApi.getJournalEntries] REST notice:', e);
    }
    return [];
  },

  createJournalEntry: async (data: JournalEntryFormValues): Promise<JournalEntry> => {
    const newJE: JournalEntry = {
      id: `JE-${Date.now().toString().slice(-4)}`,
      date: data.date,
      ref: 'Manual Journal Entry',
      memo: data.description,
      currency: 'INR',
      status: 'posted',
      createdBy: 'Finance Admin',
      approvedBy: 'Finance Controller',
      lines: [
        { account: data.debitAccount, desc: data.description, debit: data.amount, credit: 0, cc: 'CC-01', tax: 'GST-18' },
        { account: data.creditAccount, desc: data.description, debit: 0, credit: data.amount, cc: 'CC-01', tax: 'GST-18' },
      ],
    };

    try {
      const res = await api.post<any>('/journal-entries', newJE);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row as JournalEntry;
    } catch (e) {
      console.debug('[financeApi.createJournalEntry] REST notice:', e);
    }

    return newJE;
  },
};
