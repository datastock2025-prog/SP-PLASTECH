import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { itemService } from '../services/itemService';
import { itemEndpoints } from '../lib/api-client';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataChangeRequest,
} from '../services/masterDataGovernanceService';
import { ItemMaster, MachineMaster, Customer, BomMaster } from '../types';

// ============================================================================
// MASTER DATA — TANSTACK REACT QUERY HOOKS (v5)
// Multi-Tenant Gateway + Strict API-First & Live Database Sync
// ============================================================================

// 1. ITEMS / ITEM MASTER CATALOG
export function useItems(filter?: any) {
  return useQuery<ItemMaster[]>({
    queryKey: queryKeys.masterData.items(filter),
    queryFn: async () => {
      const items = await itemService.getItems();
      return items;
    },
    staleTime: 1000 * 60 * 5, // Rule 1: 5 minutes fresh cache
    refetchOnWindowFocus: true, // Rule 1: Refetch on focus for cross-browser synchronization
  });
}

// Rule 2: Strict Paginated Items Query with Cursor / Offset parameters
export function usePaginatedItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['masterData', 'paginatedItems', params],
    queryFn: async () => {
      return await itemEndpoints.getItemsPaginated(params);
    },
    staleTime: 1000 * 60 * 5, // Rule 1: 5 minutes
    refetchOnWindowFocus: true, // Rule 1: refetch on focus
  });
}

export function useItemDetail(code?: string) {
  return useQuery<ItemMaster | undefined>({
    queryKey: ['masterData', 'itemDetail', code],
    queryFn: async () => {
      if (!code) return undefined;
      return await itemService.getItemByCode(code);
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
      return await itemService.saveItem(item);
    },
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', savedItem);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      return await itemService.deleteItem(code);
    },
    onSuccess: (_, code) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
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
      return await itemService.approveItem(item, reviewerName, comment);
    },
    onSuccess: (approvedItem) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
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
      return await itemService.rejectItem(item, reviewerName, reason);
    },
    onSuccess: (rejectedItem) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
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
      return await itemService.syncLiveCatalog();
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

import { liveDataStore } from '../services/liveDataStore';

// 4. MACHINES
export function useMachines() {
  return useQuery<MachineMaster[]>({
    queryKey: queryKeys.masterData.machines(),
    queryFn: async () => {
      return await liveDataStore.getMachines();
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: MachineMaster) => {
      return await liveDataStore.saveMachine(machine);
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
      return await liveDataStore.deleteMachine(id);
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
      return await liveDataStore.getCustomers();
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      return await liveDataStore.saveCustomer(customer);
    },
    onSuccess: (savedCustomer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.customers() });
      broadcastLocalMutation('CUSTOMERS', 'UPDATE', savedCustomer);
    },
  });
}

