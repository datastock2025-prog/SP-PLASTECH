import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { itemEndpoints, ItemMasterDto, PaginatedItemsResponse } from '../../../lib/api-client';

// ============================================================================
// ENTERPRISE DATA FETCHING WITH TANSTACK QUERY (REACT QUERY v5)
// Eliminates duplicate calls, cross-browser data drift, and custom sync managers
// ============================================================================

export interface UseItemsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

/**
 * Enterprise Paginated Item Master Hook
 * Strict cursor/range pagination + 5-minute cache + auto window-focus revalidation
 */
export function useItemMasterGrid(params: UseItemsQueryParams = {}) {
  const queryClient = useQueryClient();
  const { page = 1, limit = 50, search = '', category = 'All', status = 'ALL' } = params;

  // 1. Paginated Query (SSOT)
  const itemsQuery = useQuery<PaginatedItemsResponse>({
    queryKey: ['items', 'grid', { page, limit, search, category, status }],
    queryFn: () => itemEndpoints.getItemsPaginated({ page, limit, search, category, status }),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh cache (Rule 1)
    refetchOnWindowFocus: true, // Auto-sync when switching between Brave & Chrome (Rule 1)
    placeholderData: keepPreviousData, // Smooth pagination UX
    retry: 2, // Retry network glitches twice
  });

  // 2. Save Item Mutation with Immediate Representation Cache Write (Zero Stale Overwrite)
  const saveMutation = useMutation({
    mutationFn: (item: ItemMasterDto) => itemEndpoints.saveItem(item),
    onSuccess: (saved) => {
      queryClient.setQueriesData({ queryKey: ['items'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          const exists = old.some((i: any) => i.code === saved.code);
          return exists ? old.map((i: any) => (i.code === saved.code ? saved : i)) : [saved, ...old];
        }
        if (old.items && Array.isArray(old.items)) {
          const exists = old.items.some((i: any) => i.code === saved.code);
          return {
            ...old,
            items: exists ? old.items.map((i: any) => (i.code === saved.code ? saved : i)) : [saved, ...old.items],
          };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // 3. Delete Item Mutation with Immediate Representation Cache Eviction
  const deleteMutation = useMutation({
    mutationFn: (code: string) => itemEndpoints.deleteItem(code),
    onSuccess: (_, code) => {
      queryClient.setQueriesData({ queryKey: ['items'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter((i: any) => i.code !== code);
        }
        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            items: old.items.filter((i: any) => i.code !== code),
            totalCount: Math.max(0, (old.totalCount || 1) - 1),
          };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // 4. Grid In Bulk Import Mutation
  const bulkImportMutation = useMutation({
    mutationFn: (items: ItemMasterDto[]) => itemEndpoints.bulkImport(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return {
    // Data & Query States
    items: itemsQuery.data?.items || [],
    totalCount: itemsQuery.data?.totalCount || 0,
    page: itemsQuery.data?.page || page,
    limit: itemsQuery.data?.limit || limit,
    hasMore: itemsQuery.data?.hasMore || false,
    isLoading: itemsQuery.isLoading,
    isFetching: itemsQuery.isFetching,
    isError: itemsQuery.isError,
    error: itemsQuery.error,
    refetch: itemsQuery.refetch,

    // Mutation Operations
    saveItem: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    bulkImport: bulkImportMutation.mutateAsync,
    isImporting: bulkImportMutation.isPending,
  };
}
