import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { liveDataStore } from '../services/liveDataStore';
import { SalesOrder, Quotation, ReturnMerchandise } from '../types';

// ============================================================================
// SALES & CRM — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useSalesOrders(_filter?: any) {
  return useQuery<SalesOrder[]>({
    queryKey: queryKeys.sales.orders(_filter),
    queryFn: async () => {
      return await liveDataStore.getSalesOrders();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (so: SalesOrder) => {
      return await liveDataStore.saveSalesOrder(so);
    },
    onSuccess: (savedSO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('SALES_ORDERS', 'UPDATE', savedSO);
    },
  });
}

export function useQuotations(_filter?: any) {
  return useQuery<Quotation[]>({
    queryKey: queryKeys.sales.quotations(_filter),
    queryFn: async () => {
      return await liveDataStore.getQuotations();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quote: Quotation) => {
      return await liveDataStore.saveQuotation(quote);
    },
    onSuccess: (savedQuote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.quotations() });
      broadcastLocalMutation('QUOTATIONS', 'UPDATE', savedQuote);
    },
  });
}

export function useSalesRmas() {
  return useQuery<ReturnMerchandise[]>({
    queryKey: queryKeys.sales.rmas(),
    queryFn: async () => {
      return await liveDataStore.getRmas();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSalesRma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rma: ReturnMerchandise) => {
      return await liveDataStore.saveRma(rma);
    },
    onSuccess: (savedRma) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.rmas() });
      broadcastLocalMutation('RMAS', 'UPDATE', savedRma);
    },
  });
}

