import React from 'react';

interface ModuleLoadingFallbackProps {
  moduleName?: string;
}

/**
 * Silent, non-intrusive structural skeleton for React.Suspense boundaries.
 * Renders layout-matching placeholder geometry without intrusive loading banners, text, or spinners.
 */
export const ModuleLoadingFallback: React.FC<ModuleLoadingFallbackProps> = () => {
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
