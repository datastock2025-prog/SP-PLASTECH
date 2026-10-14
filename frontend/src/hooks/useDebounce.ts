import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value changes (e.g. search / filter keystrokes).
 * Prevents continuous re-filtering or hammering network requests.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating debounced value (default 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
