'use client';

import * as React from 'react';

/**
 * Custom hook to debounce a value by a specified delay in milliseconds.
 * Commonly used for search inputs and filter triggers across tables.
 *
 * @param value The value to debounce.
 * @param delay Delay in milliseconds (default: 300ms).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
