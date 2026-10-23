import React from 'react';
import { Database, Plus, RefreshCw, AlertCircle } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'card' | 'subtle';
}

/**
 * Standard Empty State Display Component
 * Provides a friendly, informative custom message when primary database and cache return 0 records.
 * Strictly adheres to the Database-First Standard (Platform Standards Spec).
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'There are no active records in the database. Provision a new record or adjust your filter query.',
  icon,
  action,
  secondaryAction,
  className = '',
  variant = 'default',
}) => {
  const containerClasses =
    variant === 'card'
      ? 'p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs'
      : variant === 'subtle'
      ? 'p-6 bg-slate-50/60 dark:bg-slate-900/40 rounded-lg'
      : 'py-12 px-4';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center max-w-md mx-auto ${containerClasses} ${className}`}
      data-testid="empty-state-view"
    >
      <div className="p-3.5 bg-gradient-to-b from-indigo-50 to-slate-100 dark:from-indigo-950/40 dark:to-slate-800 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 shadow-xs border border-indigo-100/60 dark:border-indigo-900/30">
        {icon || <Database className="w-8 h-8 opacity-80" />}
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 cursor-pointer"
            >
              {action.icon || <Plus className="w-3.5 h-3.5" />}
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 opacity-70" />
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
