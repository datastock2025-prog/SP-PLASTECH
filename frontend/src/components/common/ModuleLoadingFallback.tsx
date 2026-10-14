import React from 'react';
import { Loader2, Layers, Cpu } from 'lucide-react';

interface ModuleLoadingFallbackProps {
  moduleName?: string;
}

export const ModuleLoadingFallback: React.FC<ModuleLoadingFallbackProps> = ({
  moduleName = 'ERP Module',
}) => {
  return (
    <div className="w-full h-full min-h-[450px] p-6 flex flex-col justify-center items-center space-y-6 animate-fade-in">
      {/* Branded Shimmer Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs relative overflow-hidden">
        {/* Top Shimmer Pulse Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-teal-500 to-indigo-500 animate-pulse" />

        {/* Header Loading Skeleton */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  Loading {moduleName}...
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                  <Cpu className="w-2.5 h-2.5 mr-1 animate-spin" />
                  Code-Splitted
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dynamically hydrating enterprise bounded context & TanStack Query cache
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        </div>

        {/* Body Shimmer Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5 animate-pulse"
            >
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>

        {/* Table Shimmer Rows */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((rowIdx) => (
            <div
              key={rowIdx}
              className="h-10 rounded-lg bg-slate-100/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 animate-pulse flex items-center px-4 justify-between"
            >
              <div
                className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded"
                style={{ width: `${30 + rowIdx * 12}%` }}
              />
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
