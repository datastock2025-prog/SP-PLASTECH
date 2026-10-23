import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './api/errors.js';

function handleGlobalError(error: unknown, meta?: Record<string, unknown>) {
  if (meta?.skipGlobalError) return;

  if (error instanceof ApiError) {
    if (error.status === 401) {
      if (typeof window !== 'undefined') {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?returnTo=${returnTo}`;
        }
      }
      return;
    }
    if (error.status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:forbidden', { detail: { error } }));
      }
      return;
    }
    // 5xx / Network error toast with Reference: <requestId>
    const refText = error.requestId ? ` (Reference: ${error.requestId})` : '';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: {
          type: 'error',
          message: `${error.message}${refText}`,
          requestId: error.requestId,
        },
      }));
    }
    return;
  }

  // Fallback network or unexpected client exception
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: {
        type: 'error',
        message: (error as Error)?.message || 'Network error. Please verify connection.',
      },
    }));
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      handleGlobalError(error, query.meta);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      handleGlobalError(error, mutation.meta);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds default
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error) => {
        // Never retry client/validation/permission errors
        if (error instanceof ApiError && [400, 401, 403, 404, 409, 422].includes(error.status)) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
