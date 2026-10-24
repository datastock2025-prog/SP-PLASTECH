import React, { useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { QueryErrorState } from './QueryErrorState';

export interface ColumnDef<T> {
  id?: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface EntityTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  selectedIds?: Set<string | number> | (string | number)[];
  onSelectRow?: (id: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  emptyMessage?: string;
  emptySubtext?: string;
  emptyAction?: { label: string; onClick: () => void; icon?: React.ReactNode };
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  stickyHeader?: boolean;
  virtualized?: boolean;
  virtualRowHeight?: number;
  scrollMaxHeight?: string | number;
  hideToolbar?: boolean;
  hidePagination?: boolean;
  className?: string;
  headerClassName?: string;
}

interface TableRowProps<T> {
  row: T;
  rIdx: number;
  rowKey: string | number;
  isSelected: boolean;
  columns: ColumnDef<T>[];
  hasRowActions: boolean;
  onSelectRow?: (id: string | number, selected: boolean) => void;
  onRowClick?: (row: T) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

function areTableRowPropsEqual<T extends Record<string, any>>(
  prev: TableRowProps<T>,
  next: TableRowProps<T>
): boolean {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.rowKey !== next.rowKey) return false;
  if (prev.rIdx !== next.rIdx) return false;
  if (prev.columns !== next.columns) return false;
  if (prev.hasRowActions !== next.hasRowActions) return false;
  return prev.row === next.row;
}

const TableRow = React.memo(
  function TableRow<T extends Record<string, any>>({
    row,
    rIdx,
    rowKey,
    isSelected,
    columns,
    hasRowActions,
    onSelectRow,
    onRowClick,
    onView,
    onEdit,
    onDelete,
  }: TableRowProps<T>) {
    return (
      <tr
        key={rowKey}
        onClick={() => onRowClick && onRowClick(row)}
        className={`group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
          onRowClick ? 'cursor-pointer' : ''
        } ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}
      >
        {onSelectRow && (
          <td
            className="px-4 py-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectRow(rowKey, e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
          </td>
        )}

        {columns.map((col, cIdx) => {
          const colId = col.id || String(col.accessorKey || cIdx);
          const val = col.accessorKey ? row[col.accessorKey] : undefined;

          return (
            <td
              key={colId}
              className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${
                col.align === 'center'
                  ? 'text-center'
                  : col.align === 'right'
                  ? 'text-right'
                  : 'text-left'
              }`}
            >
              {col.cell ? col.cell(row, rIdx) : String(val ?? '—')}
            </td>
          );
        })}

        {hasRowActions && (
          <td
            className="px-4 py-3 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {onView && (
                <button
                  title="View details"
                  onClick={() => onView(row)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {onEdit && (
                <button
                  title="Edit item"
                  onClick={() => onEdit(row)}
                  className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  title="Delete record"
                  onClick={() => onDelete(row)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    );
  },
  areTableRowPropsEqual
) as <T extends Record<string, any>>(props: TableRowProps<T>) => React.ReactElement;

export function EntityTable<T extends Record<string, any>>({
  data = [],
  columns,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  totalCount,
  page = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterSlot,
  actionSlot,
  title,
  subtitle,
  icon,
  onRowClick,
  keyExtractor = (row: T, idx: number) => row.id || row.code || row._id || idx,
  selectedIds,
  onSelectRow,
  onSelectAll,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your filters or search query',
  emptyAction,
  sortBy: controlledSortBy,
  sortDirection: controlledSortDir,
  onSort: controlledOnSort,
  onView,
  onEdit,
  onDelete,
  stickyHeader = true,
  virtualized = false,
  virtualRowHeight = 44,
  scrollMaxHeight,
  hideToolbar = false,
  hidePagination = false,
  className,
  headerClassName,
}: EntityTableProps<T>) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc');
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [localSearch, setLocalSearch] = useState<string>(searchValue ?? '');

  // Keep localSearch in sync if parent changes searchValue externally
  React.useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
    }
  }, [searchValue]);

  // Debounce search emissions by 300ms to eliminate connection thrashing and premature cancellations
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) {
        if (localSearch !== (searchValue ?? '')) {
          onSearchChange(localSearch);
        }
      } else {
        setInternalSearch(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchValue]);

  const effectiveSearch = searchValue !== undefined ? searchValue : internalSearch;
  const effectiveSortBy = controlledSortBy !== undefined ? controlledSortBy : internalSortBy;
  const effectiveSortDir = controlledSortDir !== undefined ? controlledSortDir : internalSortDir;

  const handleSort = (colId: string) => {
    if (controlledOnSort) {
      controlledOnSort(colId);
      return;
    }
    if (internalSortBy === colId) {
      setInternalSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setInternalSortBy(colId);
      setInternalSortDir('asc');
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  // Client-side filtering & sorting if not server-controlled
  const processedData = useMemo(() => {
    if (totalCount !== undefined && onPageChange) {
      // Server-side managed data
      return data;
    }

    let list = [...data];

    // Search filter
    if (effectiveSearch.trim()) {
      const q = effectiveSearch.toLowerCase().trim();
      list = list.filter((item) =>
        Object.values(item).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (effectiveSortBy) {
      const col = columns.find((c) => (c.id || String(c.accessorKey)) === effectiveSortBy);
      const key = col?.accessorKey || (effectiveSortBy as keyof T);
      list.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return effectiveSortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return effectiveSortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [data, totalCount, onPageChange, effectiveSearch, effectiveSortBy, effectiveSortDir, columns]);

  // Client-side pagination if needed
  const displayRows = useMemo(() => {
    if (totalCount !== undefined && onPageChange) {
      return processedData;
    }
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, totalCount, onPageChange, page, pageSize]);

  const effectiveTotal = totalCount !== undefined ? totalCount : processedData.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Selection helpers
  const selectedSet = useMemo(() => {
    if (!selectedIds) return new Set<string | number>();
    return selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  }, [selectedIds]);

  const isAllSelected = displayRows.length > 0 && displayRows.every((r, idx) => selectedSet.has(keyExtractor(r, idx)));
  const isSomeSelected = displayRows.some((r, idx) => selectedSet.has(keyExtractor(r, idx))) && !isAllSelected;

  const hasRowActions = onView || onEdit || onDelete;

  const isVirtualized = Boolean(virtualized && displayRows.length > 0);

  const rowVirtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => virtualRowHeight,
    overscan: 5,
    enabled: isVirtualized,
  });

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col transition-all duration-200 ${className || ''}`}>
      {/* Header & Controls Toolbar */}
      {!hideToolbar && (title || searchPlaceholder || filterSlot || actionSlot) && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          {title && (
            <div className="flex items-center gap-2.5">
              {icon && <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">{icon}</div>}
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {title}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {effectiveTotal.toLocaleString()} items
                  </span>
                </h3>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 ml-auto w-full md:w-auto">
            {/* Search Input */}
            {onSearchChange !== undefined || searchValue !== undefined || searchPlaceholder ? (
              <div className="relative flex-1 md:w-64 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={handleSearchInput}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {localSearch && (
                  <button
                    onClick={() => {
                      setLocalSearch('');
                      if (onSearchChange) onSearchChange('');
                      else setInternalSearch('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : null}

            {filterSlot}
            {actionSlot}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-x-auto relative ${isVirtualized ? 'overflow-y-auto' : ''}`}
        style={isVirtualized ? { maxHeight: scrollMaxHeight || '600px' } : undefined}
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead className={`bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800 ${stickyHeader ? 'sticky top-0 z-10' : ''} ${headerClassName || ''}`}>
            <tr>
              {onSelectRow && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                </th>
              )}

              {columns.map((col, idx) => {
                const colId = col.id || String(col.accessorKey || idx);
                const isSorted = effectiveSortBy === colId;
                const isSortable = col.sortable !== false && col.accessorKey !== undefined;

                return (
                  <th
                    key={colId}
                    style={{ width: col.width }}
                    onClick={() => isSortable && handleSort(colId)}
                    className={`px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 select-none ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    } ${isSortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors' : ''}`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            effectiveSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {hasRowActions && (
                <th className="w-24 px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {isError ? (
              // In-Place Query Error State with Retry
              <tr>
                <td
                  colSpan={columns.length + (onSelectRow ? 1 : 0) + (hasRowActions ? 1 : 0)}
                  className="py-8 px-4"
                >
                  <QueryErrorState error={error} onRetry={onRetry} />
                </td>
              </tr>
            ) : isLoading ? (
              // Shimmer Loading Skeleton
              Array.from({ length: Math.min(pageSize, 6) }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {onSelectRow && (
                    <td className="px-4 py-3 text-center">
                      <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="px-4 py-3">
                      <div
                        className="h-4 bg-slate-200 dark:bg-slate-800 rounded"
                        style={{ width: `${60 + ((rIdx + cIdx) % 4) * 10}%` }}
                      />
                    </td>
                  ))}
                  {hasRowActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : displayRows.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (onSelectRow ? 1 : 0) + (hasRowActions ? 1 : 0)}
                  className="py-8 px-4"
                >
                  <EmptyState
                    title={emptyMessage}
                    description={emptySubtext}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : isVirtualized ? (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + (onSelectRow ? 1 : 0) + (hasRowActions ? 1 : 0)}
                      style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px`, padding: 0, border: 'none' }}
                    />
                  </tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = displayRows[virtualRow.index];
                  const rowKey = keyExtractor(row, virtualRow.index);
                  const isSelected = selectedSet.has(rowKey);

                  return (
                    <TableRow
                      key={rowKey}
                      row={row}
                      rIdx={virtualRow.index}
                      rowKey={rowKey}
                      isSelected={isSelected}
                      columns={columns}
                      hasRowActions={Boolean(hasRowActions)}
                      onSelectRow={onSelectRow}
                      onRowClick={onRowClick}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  (() => {
                    const vItems = rowVirtualizer.getVirtualItems();
                    const paddingBottom = rowVirtualizer.getTotalSize() - vItems[vItems.length - 1].end;
                    return paddingBottom > 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + (onSelectRow ? 1 : 0) + (hasRowActions ? 1 : 0)}
                          style={{ height: `${paddingBottom}px`, padding: 0, border: 'none' }}
                        />
                      </tr>
                    ) : null;
                  })()
                )}
              </>
            ) : (
              displayRows.map((row, rIdx) => {
                const rowKey = keyExtractor(row, rIdx);
                const isSelected = selectedSet.has(rowKey);

                return (
                  <TableRow
                    key={rowKey}
                    row={row}
                    rIdx={rIdx}
                    rowKey={rowKey}
                    isSelected={isSelected}
                    columns={columns}
                    hasRowActions={Boolean(hasRowActions)}
                    onSelectRow={onSelectRow}
                    onRowClick={onRowClick}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!hidePagination && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{effectiveTotal > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white">{Math.min(page * pageSize, effectiveTotal)}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{effectiveTotal.toLocaleString()}</strong> results
            </span>

            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          {/* Page Nav */}
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange && onPageChange(1)}
              title="First Page"
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange && onPageChange(page - 1)}
              title="Previous Page"
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 font-medium text-slate-800 dark:text-slate-200">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange && onPageChange(page + 1)}
              title="Next Page"
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange && onPageChange(totalPages)}
              title="Last Page"
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
