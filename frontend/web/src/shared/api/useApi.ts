'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { ApiError } from './client';

type State<T> = { key: string; data: T } | { key: string; error: ApiError };

/**
 * Loads data for `key` (any string that changes when the request changes; null skips loading).
 * Keeps the previous data visible while a new request is in flight.
 */
export function useApi<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const load = useEffectEvent(fetcher);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ key, data }))
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ key, error: err instanceof ApiError ? err : new ApiError('internal_error', String(err), null) });
      });
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const current = state?.key === key ? state : null;
  return {
    data: state && 'data' in state ? state.data : null,
    error: current && 'error' in current ? current.error : null,
    loading: key !== null && current === null,
    retry: () => setAttempt((a) => a + 1),
  };
}
