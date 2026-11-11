"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api-client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
}

// Small shared hook so every page gets the same loading/error/empty
// handling shape rather than reinventing it per page.
export function useApi<T>(path: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const hasDataRef = useRef(false);
  const prevPathRef = useRef(path);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (prevPathRef.current !== path) {
      prevPathRef.current = path;
      hasDataRef.current = false;
    }

    // Resetting loading/error state before kicking off the fetch below is
    // the standard "fetch on mount/dependency change" shape — the
    // react-hooks/set-state-in-effect rule flags any synchronous setState
    // in an effect body, but there's no external system to subscribe to
    // here instead; the async call just below is that subscription.
    // Keep already-loaded data mounted during background refetches so saving
    // one section doesn't unmount sibling forms or wipe unsaved edits.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (hasDataRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    api
      .get<T>(path)
      .then((result) => {
        if (!cancelled) {
          hasDataRef.current = true;
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  return { data, loading, refreshing, error, refetch };
}
