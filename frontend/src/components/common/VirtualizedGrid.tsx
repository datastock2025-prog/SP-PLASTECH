import React, { useRef, memo, ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface ColumnDef<T> {
  header: ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
  className?: string;
  headerClassName?: string;
  width?: string;
}

export interface VirtualizedGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  height?: number | string;
  rowHeight?: number;
  overscan?: number;
  emptyMessage?: string;
  keyExtractor: (item: T, index: number) => string | number;
  onRowClick?: (item: T) => void;
  rowClassName?: string | ((item: T, index: number) => string);
  headerClassName?: string;
}

interface VirtualRowProps<T> {
  item: T;
  index: number;
  columns: ColumnDef<T>[];
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T) => void;
  style: React.CSSProperties;
}

// Memoized individual row component to eliminate unnecessary re-renders
const MemoizedRow = memo(function VirtualRow<T>({
  item,
  index,
  columns,
  rowClassName,
  onRowClick,
  style,
}: VirtualRowProps<T>) {
  const customClass = typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName || '';

  return (
    <div
      style={style}
      onClick={() => onRowClick && onRowClick(item)}
      className={`absolute top-0 left-0 w-full flex items-center border-b border-[#E4E0D6] hover:bg-[#F6F4EF]/60 transition-colors text-xs text-[#14213D] ${
        onRowClick ? 'cursor-pointer' : ''
      } ${customClass}`}
    >
      {columns.map((col, cIdx) => {
        let content: ReactNode = null;
        if (typeof col.accessor === 'function') {
          content = col.accessor(item);
        } else if (col.accessor) {
          content = (item as any)[col.accessor];
        }

        return (
          <div
            key={cIdx}
            className={`px-3 py-2.5 truncate flex-shrink-0 ${col.className || 'flex-1'}`}
            style={col.width ? { width: col.width, flex: 'none' } : undefined}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}) as <T>(props: VirtualRowProps<T>) => React.ReactElement;

export function VirtualizedGrid<T>({
  data,
  columns,
  height = 420,
  rowHeight = 44,
  overscan = 6,
  emptyMessage = 'No records found matching criteria.',
  keyExtractor,
  onRowClick,
  rowClassName,
  headerClassName,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  return (
    <div className="border border-[#E4E0D6] rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Sticky Table Header */}
      <div
        className={`flex items-center bg-[#F6F4EF] border-b border-[#E4E0D6] text-[10px] uppercase font-bold tracking-wider text-[#6B7280] select-none ${
          headerClassName || ''
        }`}
      >
        {columns.map((col, idx) => (
          <div
            key={idx}
            className={`px-3 py-2.5 truncate flex-shrink-0 ${col.headerClassName || col.className || 'flex-1'}`}
            style={col.width ? { width: col.width, flex: 'none' } : undefined}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized Scrollable Viewport */}
      {data.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#6B7280]">{emptyMessage}</div>
      ) : (
        <div
          ref={parentRef}
          className="overflow-auto relative will-change-transform"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = data[virtualRow.index];
              return (
                <MemoizedRow
                  key={keyExtractor(item, virtualRow.index)}
                  item={item}
                  index={virtualRow.index}
                  columns={columns}
                  rowClassName={rowClassName}
                  onRowClick={onRowClick}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
