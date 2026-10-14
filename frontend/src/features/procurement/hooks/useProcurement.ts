import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementApi } from '../api/procurementApi';
import { PurchaseOrder } from '../../../types';
import { CreatePurchaseOrderFormValues } from '../types/procurementSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const PO_QUERY_KEY = ['procurement', 'purchaseOrders'];

export function useProcurement() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: PO_QUERY_KEY,
    queryFn: () => procurementApi.getPurchaseOrders(),
  });

  const createPOMutation = useMutation({
    mutationFn: (data: CreatePurchaseOrderFormValues) => procurementApi.createPurchaseOrder(data),
    onSuccess: (newPO) => {
      queryClient.setQueryData<PurchaseOrder[]>(PO_QUERY_KEY, (old = []) => [newPO, ...old]);
      showToast(`PO ${newPO.id} raised successfully`);
    },
  });

  return {
    purchaseOrders,
    isLoading,
    createPurchaseOrder: createPOMutation.mutateAsync,
    isCreatingPO: createPOMutation.isPending,
  };
}
