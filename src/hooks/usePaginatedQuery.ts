import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, QueryKey } from '@tanstack/react-query';

export interface PaginatedQueryResult<T> {
  data: T[];
  total: number;
}

export interface UsePaginatedQueryOptions<T, F = Record<string, any>> {
  queryKey: QueryKey;
  queryFn: (params: { page: number; pageSize: number; filters: F }) => Promise<PaginatedQueryResult<T>> | PaginatedQueryResult<T>;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  filters?: F;
  staleTime?: number;
  enabled?: boolean;
}

export function usePaginatedQuery<T, F = Record<string, any>>({
  queryKey,
  queryFn,
  initialPage = 1,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  filters = {} as F,
  staleTime = 1000 * 60 * 5, // 5 min cache
  enabled = true,
}: UsePaginatedQueryOptions<T, F>) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // TanStack Query with keepPreviousData for zero-flicker transitions
  const query = useQuery({
    queryKey: [...queryKey, { page: currentPage, pageSize, filters }],
    queryFn: () => queryFn({ page: currentPage, pageSize, filters }),
    placeholderData: keepPreviousData,
    staleTime,
    enabled,
  });

  const rawData = query.data?.data ?? [];
  const totalItems = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-clamp current page if it exceeds totalPages
  const validPage = Math.min(currentPage, totalPages);
  if (validPage !== currentPage && totalPages > 0) {
    setCurrentPage(validPage);
  }

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const paginationProps = useMemo(() => ({
    currentPage: validPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSizeOptions,
  }), [validPage, totalPages, pageSize, totalItems, handlePageChange, handlePageSizeChange, pageSizeOptions]);

  return {
    data: rawData,
    totalItems,
    totalPages,
    currentPage: validPage,
    pageSize,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
    paginationProps,
  };
}
