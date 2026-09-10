import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  SlidersHorizontal,
  CheckSquare,
  Square,
  RefreshCw,
  Columns,
  Eye,
  EyeOff,
  Filter,
  Layers,
} from 'lucide-react';
import { PaginationBar } from './PaginationBar';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface AdvancedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (item: T) => string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (filterKey: string, value: string) => void;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  itemName?: string;
  onRowClick?: (item: T) => void;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedItems: T[]) => void;
    variant?: 'primary' | 'danger' | 'default';
  }[];
  actionsToolbar?: React.ReactNode;
  exportFileName?: string;
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  className?: string;
}

export function AdvancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  searchFields,
  filters,
  filterValues: externalFilterValues,
  onFilterChange: externalOnFilterChange,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'records',
  onRowClick,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  bulkActions,
  actionsToolbar,
  exportFileName = 'export-data',
  initialSortKey,
  initialSortDirection = 'asc',
  emptyMessage = 'No matching records found.',
  className = '',
}: AdvancedDataTableProps<T>) {
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Internal Filter State (if not externally controlled)
  const [internalFilterValues, setInternalFilterValues] = useState<Record<string, string>>({});
  const filterValues = externalFilterValues || internalFilterValues;
  const handleFilterChange = (key: string, val: string) => {
    if (externalOnFilterChange) {
      externalOnFilterChange(key, val);
    } else {
      setInternalFilterValues((prev) => ({ ...prev, [key]: val }));
    }
    setCurrentPage(1);
  };

  // Sorting State
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Density State
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((c) => {
      initial[c.key] = true;
    });
    return initial;
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Internal Selection State (if not externally controlled)
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = externalSelectedIds !== undefined ? externalSelectedIds : internalSelectedIds;
  const setSelected = (ids: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(ids);
    } else {
      setInternalSelectedIds(ids);
    }
  };

  // Handle Sort Toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(undefined);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Filter by dropdown values
    if (filters && filters.length > 0) {
      filters.forEach((f) => {
        const val = filterValues[f.key];
        if (val && val !== 'all') {
          result = result.filter((item) => {
            const itemVal = String(item[f.key] ?? '');
            return itemVal.toLowerCase() === val.toLowerCase();
          });
        }
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        if (searchFields && searchFields.length > 0) {
          return searchFields.some((field) => {
            const val = String(item[field as keyof T] ?? '');
            return val.toLowerCase().includes(q);
          });
        }
        // Fallback: search all visible columns
        return columns.some((col) => {
          let val = '';
          if (col.accessor) {
            val = String(col.accessor(item) ?? '');
          } else {
            val = String(item[col.key] ?? '');
          }
          return val.toLowerCase().includes(q);
        });
      });
    }

    // Sort Data
    if (sortKey) {
      const targetCol = columns.find((c) => c.key === sortKey);
      result.sort((a, b) => {
        let aVal = targetCol?.accessor ? targetCol.accessor(a) : a[sortKey];
        let bVal = targetCol?.accessor ? targetCol.accessor(b) : b[sortKey];

        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, columns, filters, filterValues, searchQuery, searchFields, sortKey, sortDirection]);

  // Paginate Data
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset page when search or data length changes
  const activeColumns = useMemo(() => {
    return columns.filter((c) => visibleColumns[c.key] !== false);
  }, [columns, visibleColumns]);

  // Selection helpers
  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(rowKey(item)));

  const handleSelectAllCurrentPage = () => {
    const pageKeys = paginatedData.map((item) => rowKey(item));
    if (allCurrentPageSelected) {
      setSelected(selectedIds.filter((id) => !pageKeys.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedIds, ...pageKeys]));
      setSelected(newSelection);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelected(selectedIds.filter((item) => item !== id));
    } else {
      setSelected([...selectedIds, id]);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = activeColumns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = filteredData.map((item) => {
      return activeColumns
        .map((c) => {
          let val = c.accessor ? c.accessor(item) : item[c.key];
          if (val === undefined || val === null) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedItems = useMemo(() => {
    return data.filter((item) => selectedIds.includes(rowKey(item)));
  }, [data, selectedIds, rowKey]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    Object.values(filterValues).some((v) => v && v !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setInternalFilterValues({});
    if (filters && externalOnFilterChange) {
      filters.forEach((f) => externalOnFilterChange(f.key, 'all'));
    }
    setSortKey(initialSortKey);
    setSortDirection(initialSortDirection);
    setCurrentPage(1);
  };

  return (
    <div className={`bg-white rounded-2xl border border-[#E4E0D6] shadow-xs overflow-hidden ${className}`}>
      {/* Header & Controls Toolbar */}
      <div className="p-4 border-b border-[#E4E0D6] space-y-3 bg-[#FCFBF9]">
        {/* Top Row: Title, Subtitle, Actions Toolbar */}
        {(title || actionsToolbar) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {title && <h3 className="text-base font-bold text-[#14213D]">{title}</h3>}
              {subtitle && <p className="text-xs text-[#6B7280]">{subtitle}</p>}
            </div>
            {actionsToolbar && <div className="flex items-center gap-2">{actionsToolbar}</div>}
          </div>
        )}

        {/* Search, Filters, Density & Utilities */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box & Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4E0D6] rounded-xl text-xs text-[#14213D] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F8B8D] shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            {filters &&
              filters.map((f) => (
                <div key={f.key} className="flex items-center">
                  <select
                    value={filterValues[f.key] || 'all'}
                    onChange={(e) => handleFilterChange(f.key, e.target.value)}
                    className="bg-white border border-[#E4E0D6] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#0F8B8D] shadow-xs cursor-pointer"
                  >
                    <option value="all">{f.label}: All</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

            {/* Clear Filters button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium border border-rose-200"
                title="Reset all filters and search"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right Utilities: Column Toggler, Density, CSV Export */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {/* Bulk Actions Badge & Buttons if rows are selected */}
            {selectedIds.length > 0 && bulkActions && (
              <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-[#E4E0D6]">
                <span className="px-2 py-0.5 rounded-full bg-[#14213D] text-white text-[11px] font-bold">
                  {selectedIds.length} selected
                </span>
                {bulkActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => action.onClick(selectedItems)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                      action.variant === 'danger'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : action.variant === 'primary'
                        ? 'bg-[#0F8B8D] text-white hover:bg-[#0c7072]'
                        : 'bg-white border border-[#E4E0D6] text-[#374151] hover:bg-[#F6F4EF]'
                    }`}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Density Selector */}
            <div className="flex items-center bg-white border border-[#E4E0D6] rounded-xl p-0.5 shadow-xs text-xs">
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  density === 'comfortable' ? 'bg-[#F6F4EF] text-[#14213D] font-bold' : 'text-[#6B7280]'
                }`}
                title="Comfortable row padding"
              >
                Comfort
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  density === 'compact' ? 'bg-[#F6F4EF] text-[#14213D] font-bold' : 'text-[#6B7280]'
                }`}
                title="Compact row padding"
              >
                Compact
              </button>
            </div>

            {/* Column Visibility Menu */}
            <div className="relative">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E4E0D6] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F6F4EF] transition-colors shadow-xs"
                title="Customize visible columns"
              >
                <Columns className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="hidden sm:inline">Columns</span>
              </button>

              {showColumnDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#E4E0D6] rounded-xl shadow-xl p-2 z-40 space-y-1">
                  <div className="text-[11px] font-bold text-[#6B7280] px-2 py-1 uppercase tracking-wider">
                    Toggle Columns
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {columns.map((col) => {
                      const isVis = visibleColumns[col.key] !== false;
                      return (
                        <label
                          key={col.key}
                          className="flex items-center justify-between px-2 py-1 rounded-lg text-xs hover:bg-[#F6F4EF] cursor-pointer"
                        >
                          <span className="text-[#374151] truncate pr-2">{col.header}</span>
                          <input
                            type="checkbox"
                            checked={isVis}
                            onChange={() =>
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [col.key]: !isVis,
                              }))
                            }
                            className="rounded border-[#E4E0D6] text-[#0F8B8D] focus:ring-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E4E0D6] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#F6F4EF] transition-colors shadow-xs"
              title="Download filtered records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-[#E4E0D6] bg-[#F6F4EF] text-[#4B5563]">
              {/* Checkbox column if selection enabled */}
              {onSelectionChange && (
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={handleSelectAllCurrentPage}
                    className="rounded border-[#E4E0D6] text-[#0F8B8D] focus:ring-0 cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
              )}

              {/* Data Columns */}
              {activeColumns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => canSort && handleSort(col.key)}
                    className={`px-3.5 py-2.5 font-bold uppercase tracking-wider text-[11px] select-none ${
                      canSort ? 'cursor-pointer hover:bg-[#EDE9E0] transition-colors' : ''
                    } ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'center'
                          ? 'justify-center'
                          : col.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-[#9CA3AF]">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#0F8B8D]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E0D6] bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColumns.length + (onSelectionChange ? 1 : 0)}
                  className="py-12 text-center text-[#9CA3AF]"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-[#CBD5E1]" />
                    <p className="text-sm font-medium text-[#4B5563]">{emptyMessage}</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-[#0F8B8D] font-bold hover:underline"
                      >
                        Reset search &amp; filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const id = rowKey(item);
                const isSelected = selectedIds.includes(id);
                const pyClass = density === 'compact' ? 'py-2' : 'py-3';

                return (
                  <tr
                    key={id || idx}
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-[#F9F8F5]' : 'hover:bg-[#FAFAF9]'
                    } ${isSelected ? 'bg-[#0F8B8D]/5' : ''}`}
                  >
                    {/* Checkbox */}
                    {onSelectionChange && (
                      <td className="w-10 px-3 text-center" onClick={(e) => handleToggleRow(id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-[#E4E0D6] text-[#0F8B8D] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Columns */}
                    {activeColumns.map((col) => {
                      const rendered = col.render
                        ? col.render(item, (currentPage - 1) * pageSize + idx)
                        : col.accessor
                        ? col.accessor(item)
                        : item[col.key];

                      return (
                        <td
                          key={col.key}
                          className={`px-3.5 ${pyClass} ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          } ${col.className || ''}`}
                        >
                          {rendered}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={pageSizeOptions}
        itemName={itemName}
      />
    </div>
  );
}
