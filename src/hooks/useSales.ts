import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { SalesOrder, Quotation, ReturnMerchandise } from '../types';

// ============================================================================
// SALES & CRM — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useSalesOrders(filter?: any) {
  return useQuery<SalesOrder[]>({
    queryKey: queryKeys.sales.orders(filter),
    queryFn: async () => {
      const res = await apiClient.get('/sales-orders', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (so: SalesOrder) => {
      const res = await apiClient.post('/sales-orders', so);
      return res.data?.data || res.data || so;
    },
    onSuccess: (savedSO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      universalSyncManager.broadcastMutation('SALES_ORDERS', 'UPDATE', savedSO);
    },
  });
}

export function useQuotations(filter?: any) {
  return useQuery<Quotation[]>({
    queryKey: queryKeys.sales.quotations(filter),
    queryFn: async () => {
      const res = await apiClient.get('/sales/quotations', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quote: Quotation) => {
      const res = await apiClient.post('/sales/quotations', quote);
      return res.data?.data || res.data || quote;
    },
    onSuccess: (savedQuote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.quotations() });
      universalSyncManager.broadcastMutation('QUOTATIONS', 'UPDATE', savedQuote);
    },
  });
}

export function useSalesRmas() {
  return useQuery<ReturnMerchandise[]>({
    queryKey: queryKeys.sales.rmas(),
    queryFn: async () => {
      const res = await apiClient.get('/sales/rmas');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveSalesRma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rma: ReturnMerchandise) => {
      const res = await apiClient.post('/sales/rmas', rma);
      return res.data?.data || res.data || rma;
    },
    onSuccess: (savedRma) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.rmas() });
      universalSyncManager.broadcastMutation('RMAS', 'UPDATE', savedRma);
    },
  });
}
