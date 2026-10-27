import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export interface InfiniteItemParams {
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export interface ItemCursorPage {
  data: any[];
  meta: {
    mode: 'cursor';
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

/**
 * Enterprise Infinite Cursor Stream Hook (TanStack Query v5)
 * O(1) Keyset streaming for high-speed continuous virtualization
 */
export function useInfiniteItemMaster(params: InfiniteItemParams = {}) {
  const { limit = 50, search = '', category = 'All', status = 'ALL' } = params;

  return useInfiniteQuery({
    queryKey: ['items', 'infinite', { limit, search, category, status }],
    queryFn: async ({ pageParam }: { pageParam: string | null }): Promise<ItemCursorPage> => {
      const res = await api.get<any>('/items', {
        params: {
          mode: 'cursor',
          limit,
          cursor: pageParam || undefined,
          search: search.trim() || undefined,
          category: category !== 'All' ? category : undefined,
          status: status !== 'ALL' ? status : undefined,
        },
      });
      const envelope = res?.data !== undefined ? res.data : res;
      return {
        data: Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [],
        meta: envelope?.meta ?? { mode: 'cursor', limit, hasMore: false, nextCursor: null },
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage?.meta?.hasMore ? lastPage.meta.nextCursor : undefined),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

