import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { liveDataStore } from '../services/liveDataStore';
import { Account, JournalEntry } from '../types';

// ============================================================================
// FINANCE & GENERAL LEDGER — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: queryKeys.finance.accounts(),
    queryFn: async () => {
      return await liveDataStore.getAccounts();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Account) => {
      return await liveDataStore.saveAccount(acc);
    },
    onSuccess: (savedAcc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.accounts() });
      universalSyncManager.broadcastMutation('ACCOUNTS', 'UPDATE', savedAcc);
    },
  });
}

export function useJournalEntries(_filter?: any) {
  return useQuery<JournalEntry[]>({
    queryKey: queryKeys.finance.journalEntries(_filter),
    queryFn: async () => {
      return await liveDataStore.getJournalEntries();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (je: JournalEntry) => {
      return await liveDataStore.saveJournalEntry(je);
    },
    onSuccess: (savedJE) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.journalEntries() });
      universalSyncManager.broadcastMutation('JOURNAL_ENTRIES', 'UPDATE', savedJE);
    },
  });
}

