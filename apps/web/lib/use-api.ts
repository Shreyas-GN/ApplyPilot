"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api-client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Small shared hook so every page gets the same loading/error/empty
// handling shape rather than reinventing it per page.
export function useApi<T>(path: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    // Resetting loading/error state before kicking off the fetch below is
    // the standard "fetch on mount/dependency change" shape — the
    // react-hooks/set-state-in-effect rule flags any synchronous setState
    // in an effect body, but there's no external system to subscribe to
    // here instead; the async call just below is that subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    api
      .get<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  return { data, loading, error, refetch };
}
