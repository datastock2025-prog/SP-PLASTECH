import { useState, useCallback } from 'react';
import { ApiResponse, ApiError } from '../types/api.types';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useApi<T = any, P extends any[] = any[]>(
  apiFn: (...args: P) => Promise<ApiResponse<T> | T>,
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await apiFn(...args);
        // Handle ApiResponse wrapper or raw data
        const extractedData = (response as ApiResponse<T>)?.data !== undefined ? (response as ApiResponse<T>).data : (response as T);
        setState({ data: extractedData, isLoading: false, error: null });
        return extractedData;
      } catch (err: any) {
        const apiError: ApiError = {
          statusCode: err.response?.status || 500,
          message: err.response?.data?.message || err.message || 'An unexpected error occurred',
          error: err.response?.data?.error,
          correlationId: err.response?.headers?.['x-correlation-id'],
        };
        setState({ data: null, isLoading: false, error: apiError });
        return null;
      }
    },
    [apiFn],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
