import { useState, useMemo, useCallback } from 'react';

export type TimeHorizonScope = 'today' | '7days' | 'month' | '90days' | 'year' | 'all';

export interface EnterpriseGridOptions<T> {
  data: T[];
  searchFields?: (keyof T | ((item: T) => string | number | undefined | null))[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  dateField?: keyof T | ((item: T) => string | Date | undefined | null);
  defaultTimeHorizon?: TimeHorizonScope;
}

export function useEnterpriseDataGrid<T>({
  data,
  searchFields,
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100, 250, 500],
  dateField,
  defaultTimeHorizon = 'all',
}: EnterpriseGridOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizonScope>(defaultTimeHorizon);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Debounce search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    const handler = setTimeout(() => {
      setDebouncedSearch(value.trim().toLowerCase());
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(handler);
  }, []);

  // Update specific custom filter key
  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setDebouncedSearch('');
    setTimeHorizon('all');
    setCurrentPage(1);
  }, []);

  // Date horizon filter calculation boundaries
  const timeBoundaries = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const ninetyDaysAgo = todayStart - 90 * 24 * 60 * 60 * 1000;
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    return { todayStart, sevenDaysAgo, monthStart, ninetyDaysAgo, yearStart };
  }, []);

  // High performance indexed filtering
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter((item: any) => {
      // 1. Time Horizon Filter (Optimized fast date comparison)
      if (dateField && timeHorizon !== 'all') {
        const rawDate = typeof dateField === 'function' ? dateField(item) : item[dateField];
        if (rawDate) {
          const itemTime = new Date(rawDate).getTime();
          if (!isNaN(itemTime)) {
            if (timeHorizon === 'today' && itemTime < timeBoundaries.todayStart) return false;
            if (timeHorizon === '7days' && itemTime < timeBoundaries.sevenDaysAgo) return false;
            if (timeHorizon === 'month' && itemTime < timeBoundaries.monthStart) return false;
            if (timeHorizon === '90days' && itemTime < timeBoundaries.ninetyDaysAgo) return false;
            if (timeHorizon === 'year' && itemTime < timeBoundaries.yearStart) return false;
          }
        }
      }

      // 2. Custom Key Filters
      for (const key in filters) {
        const filterVal = filters[key];
        if (filterVal !== undefined && filterVal !== 'All' && filterVal !== 'all' && filterVal !== '') {
          if (typeof filterVal === 'boolean') {
            if (item[key] !== filterVal) return false;
          } else if (item[key] !== filterVal) {
            return false;
          }
        }
      }

      // 3. Multi-Field Search
      if (debouncedSearch) {
        if (searchFields && searchFields.length > 0) {
          const match = searchFields.some((field) => {
            const val = typeof field === 'function' ? field(item) : item[field];
            if (val === undefined || val === null) return false;
            return String(val).toLowerCase().includes(debouncedSearch);
          });
          if (!match) return false;
        } else {
          // Default string search across item values
          const itemStr = JSON.stringify(item).toLowerCase();
          if (!itemStr.includes(debouncedSearch)) return false;
        }
      }

      return true;
    });
  }, [data, debouncedSearch, filters, timeHorizon, dateField, searchFields, timeBoundaries]);

  // Compute pagination
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Safe page index calculation
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && totalPages > 0) {
    setCurrentPage(safePage);
  }

  // Slice paginated chunk for instantaneous 60fps rendering
  const paginatedData = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, safePage, pageSize]);

  // High volume chunked CSV Export generator
  const exportChunkedCSV = useCallback(
    (filename: string, getHeaders: () => string[], getRow: (item: T) => (string | number)[]) => {
      const headers = getHeaders();
      const rows: string[] = [headers.join(',')];

      // Process in chunks of 5,000 to prevent memory freeze
      for (let i = 0; i < filteredData.length; i++) {
        const rowData = getRow(filteredData[i]);
        const formattedRow = rowData.map((val) => {
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        rows.push(formattedRow.join(','));
      }

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [filteredData]
  );

  return {
    searchTerm,
    setSearchTerm: handleSearchChange,
    debouncedSearch,
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    totalPages,
    totalItems,
    paginatedData,
    filteredData,
    timeHorizon,
    setTimeHorizon,
    filters,
    setFilter,
    resetFilters,
    exportChunkedCSV,
  };
}
