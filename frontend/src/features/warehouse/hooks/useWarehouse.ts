import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '../api/warehouseApi';
import { StockTransaction } from '../../../types';
import { StockTransferFormValues } from '../types/warehouseSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const STOCK_TX_QUERY_KEY = ['warehouse', 'transactions'];

export function useWarehouse() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: transactions = [], isLoading } = useQuery<StockTransaction[]>({
    queryKey: STOCK_TX_QUERY_KEY,
    queryFn: () => warehouseApi.getTransactions(),
  });

  const transferMutation = useMutation({
    mutationFn: (data: StockTransferFormValues) => warehouseApi.createTransfer(data),
    onSuccess: (newTx) => {
      queryClient.setQueryData<StockTransaction[]>(STOCK_TX_QUERY_KEY, (old = []) => [newTx, ...old]);
      showToast(`Stock transfer ${newTx.id} completed`);
    },
  });

  return {
    transactions,
    isLoading,
    transferStock: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
  };
}
