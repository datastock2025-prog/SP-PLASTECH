import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { Account, JournalEntry } from '../types';

// ============================================================================
// FINANCE & GENERAL LEDGER — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: queryKeys.finance.accounts(),
    queryFn: async () => {
      const res = await apiClient.get('/finance/accounts');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Account) => {
      const res = await apiClient.post('/finance/accounts', acc);
      return res.data?.data || res.data || acc;
    },
    onSuccess: (savedAcc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts() });
      universalSyncManager.broadcastMutation('ACCOUNTS', 'UPDATE', savedAcc);
    },
  });
}

export function useJournalEntries(filter?: any) {
  return useQuery<JournalEntry[]>({
    queryKey: queryKeys.finance.journalEntries(filter),
    queryFn: async () => {
      const res = await apiClient.get('/finance/journal-entries', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (je: JournalEntry) => {
      const res = await apiClient.post('/finance/journal-entries', je);
      return res.data?.data || res.data || je;
    },
    onSuccess: (savedJE) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.journalEntries() });
      universalSyncManager.broadcastMutation('JOURNAL_ENTRIES', 'UPDATE', savedJE);
    },
  });
}
