import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { db } from '../shared/db';
import { Account, JournalEntry } from '../types';
import { initialAccounts } from '../data/initialData';

// ============================================================================
// FINANCE & GENERAL LEDGER — TANSTACK REACT QUERY HOOKS (SSOT)
// ============================================================================

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: queryKeys.finance.accounts(),
    queryFn: async () => {
      try {
        const res = await db.findMany<Account>('accounts', {
          orderBy: { column: 'code', ascending: true },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useAccounts] query note:', e);
      }
      return initialAccounts as any;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Account) => {
      try {
        await db.upsert('accounts', acc, 'id');
      } catch (e) {
        console.debug('[useSaveAccount] notice:', e);
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
        const res = await db.findMany<JournalEntry>('journal_entries', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useJournalEntries] query note:', e);
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
      try {
        await db.upsert('journal_entries', je, 'id');
      } catch (e) {
        console.debug('[useSaveJournalEntry] notice:', e);
      }
      return je;
    },
    onSuccess: (savedJE) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.journalEntries() });
      broadcastLocalMutation('JOURNAL_ENTRIES', 'UPDATE', savedJE);
    },
  });
}

