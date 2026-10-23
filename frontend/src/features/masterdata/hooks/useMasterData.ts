import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api-client';
import { ItemMaster } from '../../../types';
import { CreateItemFormValues } from '../types/masterDataSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const ITEMS_QUERY_KEY = ['masterdata', 'items'];

export function useMasterData() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: items = [], isLoading } = useQuery<ItemMaster[]>({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get<any>('/items');
      const envelope = res?.data !== undefined ? res.data : res;
      return Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [];
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemFormValues) => {
      const res = await api.post<any>('/items', data);
      return res?.data?.data ?? res?.data;
    },
    onSuccess: (newItem: ItemMaster) => {
      queryClient.setQueryData<ItemMaster[]>(ITEMS_QUERY_KEY, (old = []) => [newItem, ...old]);
      showToast(`SKU ${newItem.code} created successfully`);
    },
  });

  return {
    items,
    isLoading,
    createItem: createItemMutation.mutateAsync,
    isCreatingItem: createItemMutation.isPending,
  };
}
