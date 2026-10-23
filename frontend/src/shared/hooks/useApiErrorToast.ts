import { useCallback } from 'react';
import { useUiStore } from '../stores/uiStore';
import { ApiError } from '../api/http';

export interface ApiErrorToastOptions {
  fallbackMessage?: string;
  onRetry?: () => void;
  preserveDraft?: () => void;
}

/**
 * Enterprise API Error Toast Hook
 * Strictly implements the Error Response Matrix from Platform Standards Specification (Page 2).
 * Formats user-facing error toasts without leaking raw stack traces.
 */
export function useApiErrorToast() {
  const showToast = useUiStore((state) => state.showToast);

  const handleError = useCallback((error: unknown, options?: ApiErrorToastOptions) => {
    const { fallbackMessage, preserveDraft } = options || {};

    if (!(error instanceof ApiError)) {
      const msg = error instanceof Error ? error.message : fallbackMessage || 'An unexpected error occurred.';
      showToast(`⚠️ ${msg}`);
      return;
    }

    const { status, code, message, details, requestId } = error;
    const reqTrace = requestId ? ` [Req: ${requestId.slice(-6)}]` : '';

    switch (status) {
      // 400 / 422: Validation & Integrity errors -> extract field errors
      case 400:
      case 422: {
        let fieldSummary = '';
        if (Array.isArray(details) && details.length > 0) {
          fieldSummary = details
            .map((d: any) => (d.path ? `${d.path}: ${d.message}` : d.message))
            .slice(0, 2)
            .join(' | ');
        }
        showToast(`❌ Validation Error: ${fieldSummary || message}${reqTrace}`);
        break;
      }

      // 401: Unauthorized / Session Expired
      case 401: {
        if (preserveDraft) {
          try { preserveDraft(); } catch {}
        }
        showToast('🔒 Session expired. Please sign in again to resume your work.');
        break;
      }

      // 403: Forbidden / Access Denied
      case 403: {
        if (code === 'PASSWORD_CHANGE_REQUIRED') {
          showToast('🔑 Password change required before performing this action.');
        } else {
          showToast(`🛡️ Access Denied: You lack permissions for this operation.${reqTrace}`);
        }
        break;
      }

      // 409: Concurrency Conflict
      case 409: {
        showToast(`⚠️ Conflict: Record modified elsewhere. Please reload the latest data.${reqTrace}`);
        break;
      }

      // 429: Rate Limited
      case 429: {
        showToast('⏳ Rate limit reached. Please slow down and wait momentarily before retrying.');
        break;
      }

      // 5xx / Network / Default
      default: {
        if (!navigator.onLine) {
          showToast('📡 Network Disconnected: Please check your internet connection.');
        } else {
          showToast(`❌ Server Error (${code || status}): ${message || fallbackMessage || 'Operation failed'}.${reqTrace}`);
        }
        break;
      }
    }
  }, [showToast]);

  return { handleError };
}

export default useApiErrorToast;
