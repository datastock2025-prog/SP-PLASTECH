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
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Metric summary card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E0D6] dark:border-slate-800 space-y-2"
          >
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Table rows skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E4E0D6] dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="h-10 bg-[#F6F4EF] dark:bg-slate-800/60" />
        {[1, 2, 3, 4, 5, 6].map((rowIdx) => (
          <div key={rowIdx} className="h-12 flex items-center px-4 justify-between gap-4">
            <div
              className="h-4 bg-slate-200 dark:bg-slate-800 rounded"
              style={{ width: `${25 + (rowIdx % 4) * 15}%` }}
            />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleLoadingFallback;
