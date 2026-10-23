import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, WifiOff, FileQuestion, Clock } from 'lucide-react';
import { ApiError } from '../api/http';

export interface QueryErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  customMessage?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Standard Query Error Display Component
 * Adheres strictly to Section 2.1 & 2.2 of Platform Standards Specification.
 * Surfaces specific user instructions, inline retry, and Request ID tracing without exposing stack traces.
 */
export const QueryErrorState: React.FC<QueryErrorStateProps> = ({
  error,
  onRetry,
  title,
  customMessage,
  className = '',
  compact = false,
}) => {
  const [retrying, setRetrying] = React.useState(false);

  const apiError = error instanceof ApiError ? error : null;
  const status = apiError?.status ?? 500;
  const code = apiError?.code ?? 'INTERNAL_ERROR';
  const requestId = apiError?.requestId;

  // Determine user-friendly title and instruction based on status / code
  let defaultTitle = 'Service Temporarily Unavailable';
  let defaultMessage = customMessage || (error instanceof Error ? error.message : 'An unexpected error occurred.');
  let IconComponent = AlertTriangle;
  let showRetry = true;

  if (status === 403 || code === 'FORBIDDEN') {
    defaultTitle = 'Access Denied';
    defaultMessage = customMessage || 'You do not have the required permissions to access this resource or view this plant context.';
    IconComponent = ShieldAlert;
    showRetry = false; // Page 2 spec: 403 (Forbidden) Show "Access Denied" panel. No retry button.
  } else if (status === 404 || code === 'NOT_FOUND') {
    defaultTitle = 'Resource Not Found';
    defaultMessage = customMessage || 'The requested record or endpoint could not be found.';
    IconComponent = FileQuestion;
    showRetry = false;
  } else if (status === 409 || code === 'CONCURRENCY_CONFLICT') {
    defaultTitle = 'Concurrency Conflict';
    defaultMessage = customMessage || 'This record was modified by another session. Please reload to review the latest changes.';
    IconComponent = RefreshCw;
    showRetry = true;
  } else if (status === 429 || code === 'RATE_LIMITED') {
    defaultTitle = 'Rate Limit Reached';
    defaultMessage = customMessage || 'Too many requests were submitted in a short period. Please wait momentarily before retrying.';
    IconComponent = Clock;
    showRetry = true;
  } else if (status >= 500 || !navigator.onLine) {
    defaultTitle = !navigator.onLine ? 'Network Disconnected' : 'Database or Gateway Error';
    defaultMessage = customMessage || 'Unable to connect to the backend server. Please verify your network or retry.';
    IconComponent = WifiOff;
    showRetry = true;
  }

  const finalTitle = title || defaultTitle;

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-400 ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <IconComponent className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span className="font-medium truncate">{defaultMessage}</span>
        </div>
        {showRetry && onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs max-w-md mx-auto my-6 ${className}`}
      role="alert"
      data-testid="query-error-state"
    >
      <div className="p-3.5 bg-red-50 dark:bg-red-950/40 rounded-2xl text-red-600 dark:text-red-400 mb-4 border border-red-100 dark:border-red-900/40">
        <IconComponent className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 mb-2">
        <span>{code}</span>
        {status ? <span>• HTTP {status}</span> : null}
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
        {finalTitle}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 max-w-sm">
        {defaultMessage}
      </p>

      {requestId && (
        <div className="mb-6 p-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200/60 dark:border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-mono select-all">
            Request ID: {requestId}
          </span>
        </div>
      )}

      {showRetry && onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying Connection...' : 'Retry Query'}
        </button>
      )}
    </div>
  );
};

export default QueryErrorState;
