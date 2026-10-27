import React from 'react';

interface ModuleLoadingFallbackProps {
  moduleName?: string;
}

/**
 * Silent, non-intrusive structural skeleton for React.Suspense boundaries.
 * Renders layout-matching placeholder geometry without intrusive loading banners, text, or spinners.
 */
export const ModuleLoadingFallback: React.FC<ModuleLoadingFallbackProps> = ({ moduleName }) => {
  if (moduleName === 'itemList' || moduleName === 'items' || moduleName === 'item') {
    return (
      <div className="space-y-5 max-w-[1600px] mx-auto pb-8 animate-pulse">
        {/* Item Master Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="h-3.5 w-32 bg-[#0F8B8D]/20 rounded mb-2" />
            <div className="h-7 w-40 bg-slate-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-teal-50 border border-teal-200 rounded-lg" />
            <div className="h-9 w-20 bg-slate-100 border border-slate-200 rounded-lg" />
            <div className="h-9 w-28 bg-[#14213D]/40 rounded-lg" />
          </div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="h-8 w-72 bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg" />
          <div className="flex items-center gap-1.5 flex-wrap bg-[#F6F4EF] p-1 rounded-lg border border-[#E4E0D6]">
            {[1, 2, 3, 4, 5, 6].map((chip) => (
              <div key={chip} className="h-7 w-20 bg-slate-200/70 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Table rows skeleton matching 10-column item grid */}
        <div className="bg-white rounded-xl border border-[#E4E0D6] overflow-hidden divide-y divide-slate-100 shadow-xs">
          <div className="h-10 bg-[#F6F4EF]" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((rowIdx) => (
            <div key={rowIdx} className="h-12 flex items-center px-4 justify-between gap-4">
              <div className="w-4 h-4 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-teal-100/80 rounded" />
              <div className="h-4 w-44 bg-slate-200/70 rounded" />
              <div className="h-4 bg-slate-100 rounded w-20" />
              <div className="h-4 bg-slate-200/70 rounded w-16" />
              <div className="h-4 bg-slate-100 rounded w-20" />
              <div className="h-4 bg-slate-200/70 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-4 md:p-6 space-y-4 animate-pulse">
      {/* Top action / search bar skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
        <div className="h-9 w-64 bg-slate-200/80 rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200/80 rounded-lg" />
          <div className="h-9 w-28 bg-slate-200/80 rounded-lg" />
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] overflow-hidden divide-y divide-slate-100 shadow-xs">
        <div className="h-10 bg-[#F6F4EF]" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((rowIdx) => (
          <div key={rowIdx} className="h-12 flex items-center px-4 justify-between gap-4">
            <div
              className="h-4 bg-slate-200/70 rounded"
              style={{ width: `${20 + (rowIdx % 4) * 10}%` }}
            />
            <div className="h-4 bg-slate-200/70 rounded w-28" />
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-200/70 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleLoadingFallback;
