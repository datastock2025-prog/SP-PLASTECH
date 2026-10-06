import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { db } from '../shared/db';
import { SalesOrder, Quotation, ReturnMerchandise } from '../types';
import { initialSalesOrders, INITIAL_QUOTATIONS } from '../data/initialData';

// ============================================================================
// SALES & CRM — TANSTACK REACT QUERY HOOKS (SSOT)
// ============================================================================

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
          return data.map((row: any) => ({
            id: row.id || row.so_number || row.soNumber,
            soNumber: row.so_number || row.soNumber || row.id,
            customer: row.customer_name || row.customer_code || row.customer,
            customerId: row.customer_code || row.customer_id,
            customerPoNumber: row.customer_po_number || row.po_number || '',
            orderDate: row.order_date || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-09-25'),
            deliveryDate: row.required_delivery_date || row.delivery_date || row.due_date || '2026-10-15',
            totalAmount: Number(row.total_order_value || row.total_amount || row.total_value || 0),
            status: row.status || 'Draft',
            currency: 'INR (₹)',
            plant: row.plant_warehouse || row.plant || 'Plant 1 - Pimpri Auto-Hub',
            created_at: row.created_at,
          }));
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

