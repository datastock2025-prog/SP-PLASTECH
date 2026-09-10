import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'records',
  className = '',
}) => {
  const [jumpPage, setJumpPage] = useState<string>('');

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpPage('');
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#E4E0D6] text-xs text-[#4B5563] select-none ${className}`}
    >
      {/* Left: Summary & Page Size selector */}
      <div className="flex items-center flex-wrap gap-3">
        <span className="font-medium text-[#374151]">
          Showing <span className="font-semibold text-[#14213D]">{startItem}</span> to{' '}
          <span className="font-semibold text-[#14213D]">{endItem}</span> of{' '}
          <span className="font-semibold text-[#14213D]">{totalItems}</span> {itemName}
        </span>

        <div className="flex items-center gap-1.5 pl-2 border-l border-[#E4E0D6]">
          <span className="text-[#6B7280]">Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-[#F6F4EF] border border-[#E4E0D6] rounded-md px-2 py-1 text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#0F8B8D] cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-[#6B7280]">/ page</span>
        </div>
      </div>

      {/* Right: Navigation & Jump to Page */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="First Page"
            className="p-1.5 rounded-md border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-[#4B5563] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="p-1.5 rounded-md border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-[#4B5563] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          <div className="hidden md:flex items-center space-x-1">
            {getPageNumbers().map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-[#9CA3AF]">
                    &hellip;
                  </span>
                );
              }
              const isCurrent = page === currentPage;
              return (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(Number(page))}
                  className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] text-[#374151]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <span className="md:hidden px-2 text-xs font-semibold text-[#14213D]">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            title="Next Page"
            className="p-1.5 rounded-md border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-[#4B5563] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages || totalPages === 0}
            title="Last Page"
            className="p-1.5 rounded-md border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-[#4B5563] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick jump to page */}
        {totalPages > 2 && (
          <form onSubmit={handleJumpSubmit} className="hidden lg:flex items-center gap-1 pl-2 border-l border-[#E4E0D6]">
            <span className="text-[11px] text-[#6B7280]">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder="#"
              className="w-10 px-1.5 py-1 text-xs text-center border border-[#E4E0D6] rounded bg-[#F6F4EF] focus:outline-none focus:border-[#0F8B8D]"
            />
          </form>
        )}
      </div>
    </div>
  );
};
