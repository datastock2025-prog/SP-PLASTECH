import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { ItemMaster, MachineMaster, Customer } from '../types';

// ============================================================================
// MASTER DATA — TANSTACK REACT QUERY HOOKS
// ============================================================================

// 1. ITEMS / RAW MATERIALS / FINISHED GOODS
export function useItems(filter?: any) {
  return useQuery<ItemMaster[]>({
    queryKey: queryKeys.masterData.items(filter),
    queryFn: async () => {
      const res = await apiClient.get('/items', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemMaster) => {
      const res = await apiClient.post('/items', item);
      return res.data?.data || res.data || item;
    },
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.items() });
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', savedItem);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await apiClient.delete(`/items/${code}`);
      return res.data;
    },
    onSuccess: (_, code) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.items() });
      universalSyncManager.broadcastMutation('ITEMS', 'DELETE', { code });
    },
  });
}

// 2. MACHINES
export function useMachines() {
  return useQuery<MachineMaster[]>({
    queryKey: queryKeys.masterData.machines(),
    queryFn: async () => {
      const res = await apiClient.get('/machines');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: MachineMaster) => {
      const res = await apiClient.post('/machines', machine);
      return res.data?.data || res.data || machine;
    },
    onSuccess: (savedMachine) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      universalSyncManager.broadcastMutation('MACHINES', 'UPDATE', savedMachine);
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/machines/${id}`);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      universalSyncManager.broadcastMutation('MACHINES', 'DELETE', { id });
    },
  });
}

// 3. CUSTOMERS
export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: queryKeys.sales.customers(),
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      const res = await apiClient.post('/customers', customer);
      return res.data?.data || res.data || customer;
    },
    onSuccess: (savedCustomer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.customers() });
      universalSyncManager.broadcastMutation('CUSTOMERS', 'UPDATE', savedCustomer);
    },
  });
}
