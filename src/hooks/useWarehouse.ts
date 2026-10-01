import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  binLocation: string;
  quantityOnHand: number;
  allocatedQuantity: number;
  availableQuantity: number;
  uom: string;
  lotNumber?: string;
  status: 'AVAILABLE' | 'RESERVED' | 'QUARANTINE' | 'DAMAGED';
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  itemCode: string;
  quantity: number;
  status: 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  transferredAt?: string;
}

export function useStockLedger(filter?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.warehouse.stockLedger(filter),
    queryFn: async () => {
      const response = await apiClient.get<StockItem[]>('/api/v1/warehouse/stock', { params: filter });
      return response.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useWarehouseBins() {
  return useQuery({
    queryKey: queryKeys.warehouse.bins(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/warehouse/bins');
      return response.data || [];
    },
  });
}

export function useStockTransfers() {
  return useQuery({
    queryKey: queryKeys.warehouse.transfers(),
    queryFn: async () => {
      const response = await apiClient.get<StockTransfer[]>('/api/v1/warehouse/transfers');
      return response.data || [];
    },
  });
}

export function useSaveStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: Partial<StockTransfer>) => {
      if (transfer.id) {
        const response = await apiClient.put<StockTransfer>(`/api/v1/warehouse/transfers/${transfer.id}`, transfer);
        return response.data;
      }
      const response = await apiClient.post<StockTransfer>('/api/v1/warehouse/transfers', transfer);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.transfers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.stockLedger() });
    },
  });
}

export function useQuarantineLots() {
  return useQuery({
    queryKey: queryKeys.warehouse.quarantine(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/warehouse/quarantine');
      return response.data || [];
    },
  });
}
