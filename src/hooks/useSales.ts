import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { db } from '../shared/db';
import { SalesOrder, Quotation, ReturnMerchandise } from '../types';
import { initialSalesOrders, INITIAL_QUOTATIONS } from '../data/initialData';

// ============================================================================
// SALES & CRM — TANSTACK REACT QUERY HOOKS (SSOT)
// ============================================================================

import { mapDbRowToSalesOrder } from '../shared/utils/dtoMappers';

export function useSalesOrders(_filter?: any) {
  return useQuery<SalesOrder[]>({
    queryKey: queryKeys.sales.orders(_filter),
    queryFn: async () => {
      try {
        const data = await db.findMany<any>('sales_orders', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });

        if (Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => mapDbRowToSalesOrder(row));
        }
      } catch (e) {
        console.debug('[useSalesOrders] error:', e);
      }
      return initialSalesOrders;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (so: SalesOrder) => {
      try {
        await db.upsert('sales_orders', {
          id: so.id,
          so_number: (so as any).soNumber || so.id,
          customer_id: (so as any).customerId || (so as any).customer,
          customer_name: (so as any).customerName,
          status: (so as any).status,
          total_value: (so as any).totalValue || (so as any).totalAmount || 0,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.debug('[useSaveSalesOrder] db upsert notice:', e);
      }
      return so;
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
      try {
        const res = await db.findMany<any>('quotations', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useQuotations] query error:', e);
      }
      return INITIAL_QUOTATIONS as any;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quote: Quotation) => {
      try {
        await db.upsert('quotations', quote, 'id');
      } catch (e) {
        console.debug('[useSaveQuotation] notice:', e);
      }
      return quote;
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
      try {
        const res = await db.findMany<any>('rmas', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useSalesRmas] query error:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSalesRma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rma: ReturnMerchandise) => {
      try {
        await db.upsert('rmas', rma, 'id');
      } catch (e) {
        console.debug('[useSaveSalesRma] notice:', e);
      }
      return rma;
    },
    onSuccess: (savedRma) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.rmas() });
      broadcastLocalMutation('RMAS', 'UPDATE', savedRma);
    },
  });
}

