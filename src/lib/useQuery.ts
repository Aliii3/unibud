import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type * as SQLite from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-runs the query. Call after any write so the screen reflects it. */
  refresh: () => void;
}

/**
 * Runs a read against the database and re-runs it whenever the screen regains
 * focus, so a change made on one tab shows up when you navigate back.
 */
export function useQuery<T>(
  run: (db: SQLite.SQLiteDatabase) => Promise<T>
): QueryState<T> {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // `run` is typically an inline arrow, so it is a new function every render.
  // Keeping it in a ref lets the effect depend only on the database handle.
  const runRef = useRef(run);
  runRef.current = run;

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    runRef
      .current(db)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  useFocusEffect(load);

  return { data, loading, error, refresh: load };
}
