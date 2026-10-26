import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export interface GridUrlState {
  page: number;
  pageSize: number;
  search: string;
  debouncedSearch: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseGridUrlSyncOptions {
  prefix?: string;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  debounceMs?: number;
}

/**
 * Enterprise Grid URL State Synchronization Hook
 * 
 * Synchronizes page, pageSize, search, and sorting with URL query parameters.
 * Debounces search input (300ms default) to eliminate connection thrashing.
 * Updates browser history via replaceState to maintain bookmarkable, shareable URLs.
 */
export function useGridUrlSync(options: UseGridUrlSyncOptions = {}) {
  const {
    prefix = '',
    defaultPage = 1,
    defaultPageSize = 20,
    defaultSortBy,
    defaultSortOrder = 'desc',
    debounceMs = 300,
  } = options;

  const key = useCallback((k: string) => (prefix ? `${prefix}_${k}` : k), [prefix]);

  // Read initial values from current URL params
  const getParam = useCallback((k: string) => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key(k));
  }, [key]);

  const initialPage = useMemo(() => {
    const val = getParam('page');
    const n = val ? parseInt(val, 10) : defaultPage;
    return Number.isFinite(n) && n > 0 ? n : defaultPage;
  }, [getParam, defaultPage]);

  const initialPageSize = useMemo(() => {
    const val = getParam('limit') || getParam('pageSize');
    const n = val ? parseInt(val, 10) : defaultPageSize;
    return Number.isFinite(n) && n > 0 ? n : defaultPageSize;
  }, [getParam, defaultPageSize]);

  const initialSearch = useMemo(() => getParam('search') || '', [getParam]);
  const initialSortBy = useMemo(() => getParam('sortBy') || defaultSortBy, [getParam, defaultSortBy]);
  const initialSortOrder = useMemo(() => {
    const val = getParam('sortOrder');
    return val === 'asc' || val === 'desc' ? val : defaultSortOrder;
  }, [getParam, defaultSortOrder]);

  const [page, setPageState] = useState<number>(initialPage);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [search, setSearchState] = useState<string>(initialSearch);
  const [sortBy, setSortByState] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(initialSortOrder);

  // 300ms Search Debounce to protect backend from request flooding
  const debouncedSearch = useDebounce(search, debounceMs);

  // Synchronize state changes to URL query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (page > 1) {
      params.set(key('page'), String(page));
    } else {
      params.delete(key('page'));
    }

    if (pageSize !== defaultPageSize) {
      params.set(key('limit'), String(pageSize));
    } else {
      params.delete(key('limit'));
    }

    if (debouncedSearch.trim()) {
      params.set(key('search'), debouncedSearch.trim());
    } else {
      params.delete(key('search'));
    }

    if (sortBy && sortBy !== defaultSortBy) {
      params.set(key('sortBy'), sortBy);
      params.set(key('sortOrder'), sortOrder);
    } else {
      params.delete(key('sortBy'));
      params.delete(key('sortOrder'));
    }

    const newQuery = params.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
    
    // Only update if URL actually changes
    const currentQuery = window.location.search.replace(/^\?/, '');
    if (currentQuery !== newQuery) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, key, defaultPageSize, defaultSortBy]);

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, p));
  }, []);

  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s);
    setPageState(1); // Reset to page 1 on page size change
  }, []);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPageState(1); // Reset to page 1 on search change
  }, []);

  const setSorting = useCallback((col: string, dir?: 'asc' | 'desc') => {
    if (sortBy === col) {
      setSortOrderState((prev) => (dir ?? (prev === 'asc' ? 'desc' : 'asc')));
    } else {
      setSortByState(col);
      setSortOrderState(dir ?? 'asc');
    }
    setPageState(1);
  }, [sortBy]);

  return {
    page,
    pageSize,
    search,
    debouncedSearch,
    sortBy,
    sortOrder,
    setPage,
    setPageSize,
    setSearch,
    setSorting,
  };
}
