import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { itemEndpoints } from '../lib/api-client';
import { mapDbRowToItemMaster } from '../shared/utils/dtoMappers';
import { db } from '../shared/db';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataChangeRequest,
} from '../services/masterDataGovernanceService';
import { ItemMaster, MachineMaster, Customer, BomMaster } from '../types';

// ============================================================================
// MASTER DATA — TANSTACK REACT QUERY HOOKS (v5)
// Multi-Tenant Gateway + Strict API-First & Live Database Sync
// TanStack Query Cache is the Single Source of Truth (SSOT)
// ============================================================================

// 1. ITEMS / ITEM MASTER CATALOG (Rule 2: Bounded Queries)
export function useItems(filter?: any, limit: number = 50) {
  return useQuery<ItemMaster[]>({
    queryKey: queryKeys.masterData.items({ filter, limit }),
    queryFn: async () => {
      const dtos = await itemEndpoints.getItems(limit);
      return dtos.map((dto) => mapDbRowToItemMaster(dto));
    },
    staleTime: 1000 * 60 * 5, // Rule 1: 5 minutes fresh cache
    refetchOnWindowFocus: true, // Rule 1: Refetch on focus for cross-browser synchronization
  });
}

// 1b. EXACT TOTAL ITEM COUNT (100k+ Scale Head Metadata Query)
export function useItemCount() {
  return useQuery<number>({
    queryKey: ['masterData', 'itemCount'],
    queryFn: async () => {
      try {
        const count = await db.count('items');
        return count || 0;
      } catch (e) {
        console.debug('[useItemCount] note:', e);
      }
      return 0;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useItemCatalogStats() {
  return useQuery({
    queryKey: ['masterData', 'itemCatalogStats'],
    queryFn: async () => {
      const [total, finishedGoods, pending, drafts, lowStock, active] = await Promise.all([
        db.count('items'),
        db.count('items', {
          whereIn: {
            entity_type: ['Finished Good', 'Semi-Finished Good', 'Finished Molded Component'],
          },
        }),
        db.count('items', { where: { approval: 'pending' } }),
        db.count('items', { where: { approval: 'draft' } }),
        db.count('items', { where: { status: 'low' } }),
        db.count('items', {
          where: { status: 'active' },
          whereIn: { approval: ['approved', 'released'] },
        }),
      ]);

      return { total, finishedGoods, pending, drafts, lowStock, active };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

// Rule 2: Strict Paginated Items Query with Cursor / Offset parameters
export function usePaginatedItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  itemType?: string;
  approval?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['masterData', 'paginatedItems', params],
    queryFn: async () => itemEndpoints.getItemsPaginated({ ...params, lean: false }),
    staleTime: 1000 * 60 * 5, // Rule 1: 5 minutes
    refetchOnWindowFocus: true, // Rule 1: refetch on focus
  });
}

export function useItemDetail(code?: string) {
  return useQuery<ItemMaster | undefined>({
    queryKey: ['masterData', 'itemDetail', code],
    queryFn: async () => {
      if (!code) return undefined;
      const dto = await itemEndpoints.getItemByCode(code);
      return dto ? mapDbRowToItemMaster(dto) : undefined;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useSaveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemMaster) => {
      const savedDto = await itemEndpoints.saveItem(item as any);
      return mapDbRowToItemMaster(savedDto, item);
    },
    onSuccess: (savedItem) => {
      // 1. Immediately hydrate TanStack Query cache with the returned representation (Eliminates Race Condition & Flicker)
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [savedItem];
        const exists = old.some((i) => i.code === savedItem.code || (savedItem.id && i.id === savedItem.id));
        return exists
          ? old.map((i) => (i.code === savedItem.code || (savedItem.id && i.id === savedItem.id) ? savedItem : i))
          : [savedItem, ...old];
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', savedItem.code] }, savedItem);
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', savedItem);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      return await itemEndpoints.deleteItem(code);
    },
    onSuccess: (_, code) => {
      // 1. Immediately remove from TanStack Query cache (Zero Stale Flicker)
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [];
        return old.filter((i) => i.code !== code);
      });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'DELETE', { code });
    },
  });
}

export function useApproveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      item,
      reviewerName = 'Admin Authority',
      comment = 'Approved and released SKU to live shopfloor',
    }: {
      item: ItemMaster;
      reviewerName?: string;
      comment?: string;
    }) => {
      const approved: ItemMaster = {
        ...item,
        approval: 'approved',
        status: 'active',
        approvedBy: reviewerName,
      };
      const savedDto = await itemEndpoints.saveItem(approved as any);
      return mapDbRowToItemMaster(savedDto, approved);
    },
    onSuccess: (approvedItem) => {
      // 1. Direct representation cache write
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [approvedItem];
        return old.map((i) => (i.code === approvedItem.code ? approvedItem : i));
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', approvedItem.code] }, approvedItem);
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', approvedItem);
    },
  });
}

export function useRejectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      item,
      reviewerName = 'Admin Authority',
      reason = 'Rejected in QA / Engineering review',
    }: {
      item: ItemMaster;
      reviewerName?: string;
      reason?: string;
    }) => {
      const rejected: ItemMaster = {
        ...item,
        approval: 'rejected',
        status: 'inactive',
        approvedBy: reviewerName,
      };
      const savedDto = await itemEndpoints.saveItem(rejected as any);
      return mapDbRowToItemMaster(savedDto, rejected);
    },
    onSuccess: (rejectedItem) => {
      // 1. Direct representation cache write
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [rejectedItem];
        return old.map((i) => (i.code === rejectedItem.code ? rejectedItem : i));
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', rejectedItem.code] }, rejectedItem);
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', rejectedItem);
    },
  });
}

export function useBulkImportItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: any[]) => {
      return await itemEndpoints.bulkImport(items);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', { count: result.importedCount });
    },
  });
}

export function useBulkSyncCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const dtos = await itemEndpoints.getItems();
      return dtos.map((dto) => mapDbRowToItemMaster(dto));
    },
    onSuccess: (catalog) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', { count: catalog.length });
    },
  });
}

// 2. ITEM AUDIT TRAIL & CHANGE LEDGER
export function useItemAuditHistory(targetFilter?: { type?: string; code?: string }) {
  return useQuery<MasterDataChangeRecord[]>({
    queryKey: ['masterData', 'auditLedger', targetFilter],
    queryFn: async () => {
      return masterDataGovernanceService.getAuditHistory(targetFilter);
    },
    staleTime: 1000 * 15,
  });
}

// 3. ADMIN APPROVALS QUEUE
export function useItemApprovalsQueue() {
  return useQuery<MasterDataChangeRequest[]>({
    queryKey: ['masterData', 'approvalsQueue'],
    queryFn: async () => {
      return masterDataGovernanceService.getChangeRequests();
    },
    staleTime: 1000 * 15,
  });
}

import { initialMachines, initialCustomers } from '../data/initialData';

// 4. MACHINES
export function useMachines() {
  return useQuery<MachineMaster[]>({
    queryKey: queryKeys.masterData.machines(),
    queryFn: async () => {
      try {
        const res = await db.findMany<MachineMaster>('machines', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useMachines] query note:', e);
      }
      return initialMachines;
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: MachineMaster) => {
      try {
        await db.upsert('machines', machine, 'id');
      } catch (e) {
        console.debug('[useSaveMachine] notice:', e);
      }
      return machine;
    },
    onSuccess: (savedMachine) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      broadcastLocalMutation('MACHINES', 'UPDATE', savedMachine);
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await db.delete('machines', id, 'id');
      } catch (e) {
        console.debug('[useDeleteMachine] notice:', e);
      }
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      broadcastLocalMutation('MACHINES', 'DELETE', { id });
    },
  });
}

// 5. CUSTOMERS
export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: queryKeys.sales.customers(),
    queryFn: async () => {
      try {
        const res = await db.findMany<Customer>('customers', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useCustomers] query note:', e);
      }
      return initialCustomers;
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      try {
        await db.upsert('customers', customer, 'id');
      } catch (e) {
        console.debug('[useSaveCustomer] notice:', e);
      }
      return customer;
    },
    onSuccess: (savedCustomer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.customers() });
      broadcastLocalMutation('CUSTOMERS', 'UPDATE', savedCustomer);
    },
  });
}

