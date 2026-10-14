import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../api/masterDataApi';
import { ItemMaster } from '../../../types';
import { CreateItemFormValues } from '../types/masterDataSchemas';
import { useUiStore } from '../../../shared/stores/uiStore';

export const ITEMS_QUERY_KEY = ['masterdata', 'items'];

export function useMasterData() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: items = [], isLoading } = useQuery<ItemMaster[]>({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: () => masterDataApi.getItems(),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: CreateItemFormValues) => masterDataApi.createItem(data),
    onSuccess: (newItem) => {
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
