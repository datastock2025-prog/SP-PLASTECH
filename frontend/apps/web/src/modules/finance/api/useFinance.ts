import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import { Account, JournalEntry } from '@/src/types';

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: queryKeys.finance.accounts(),
    queryFn: async () => {
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
        console.debug('[useAccounts] REST query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Account) => {
      const payload = {
        account_code: acc.code,
        account_name: acc.name,
        account_type: acc.type,
        account_group: acc.sub,
        currency: acc.currency,
        current_balance: acc.balance,
        is_active: acc.status === 'active',
      };
      if (acc.code) {
        try {
          const res = await api.patch<any>(`/gl-accounts/${encodeURIComponent(acc.code)}`, payload);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/gl-accounts', payload);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      return acc;
    },
    onSuccess: (savedAcc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts() });
      broadcastLocalMutation('ACCOUNTS', 'UPDATE', savedAcc);
    },
  });
}

export function useJournalEntries(_filter?: any) {
  return useQuery<JournalEntry[]>({
    queryKey: queryKeys.finance.journalEntries(_filter),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/journal-entries', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows) && rows.length > 0) return rows;
      } catch (e) {
        console.debug('[useJournalEntries] REST query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (je: JournalEntry) => {
      if (je.id) {
        try {
          const res = await api.patch<any>(`/journal-entries/${encodeURIComponent(je.id)}`, je);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/journal-entries', je);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      return je;
    },
    onSuccess: (savedJE) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.journalEntries() });
      broadcastLocalMutation('JOURNAL_ENTRIES', 'UPDATE', savedJE);
    },
  });
}

export function useFinance() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: journalEntries = [], isLoading: isLoadingEntries } = useJournalEntries();

  return {
    accounts,
    journalEntries,
    isLoading: isLoadingAccounts || isLoadingEntries,
  };
}
