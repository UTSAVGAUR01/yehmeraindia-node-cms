/**
 * useLiveNews — React hook for fetching live news with auto-refresh.
 *
 * Features:
 *   - Auto-refresh every 5 minutes
 *   - Graceful fallback to demo data on API failure
 *   - Loading / error / lastUpdated state
 *   - Manual refresh trigger
 *   - Category filtering support
 *   - Cache-aware (uses newsApi cache)
 *   - Cleanup on unmount
 *
 * Usage:
 *   const { news, loading, error, lastUpdated, refresh } = useLiveNews();
 *   const { news } = useLiveNews('खेल'); // filter by category
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NewsItem } from '@/data/demoNews';
import { getNewsWithFallback, refreshNews } from '@/services/newsApi';
import { REFRESH_INTERVAL_MS, DEBUG_API } from '@/config/api';

interface UseLiveNewsResult {
  /** Array of news articles */
  news: NewsItem[];
  /** True while fetching data */
  loading: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** Timestamp of last successful update */
  lastUpdated: Date | null;
  /** Manually trigger a refresh */
  refresh: () => void;
  /** True if data came from live API (not demo fallback) */
  isLive: boolean;
}

function log(...args: unknown[]): void {
  if (DEBUG_API) console.log('[useLiveNews]', ...args);
}

/**
 * Hook that fetches live news with auto-refresh every 5 minutes.
 *
 * @param category — Optional Hindi category name to filter by (e.g. 'खेल', 'तकनीक')
 * @returns News data, loading state, error, last update time, and refresh function
 */
export function useLiveNews(category?: string): UseLiveNewsResult {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  // Use refs to avoid stale closures in the interval callback
  const categoryRef = useRef(category);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  // Keep category ref in sync
  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  /**
   * Core fetch logic — tries live API then falls back to demo data.
   */
  const doFetch = useCallback(
    async (forceRefresh = false): Promise<void> => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        log('Fetch already in progress, skipping');
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        log(
          forceRefresh ? 'Force refreshing...' : 'Fetching news...',
          categoryRef.current ? `category: ${categoryRef.current}` : '(all)'
        );

        const fetchFn = forceRefresh ? refreshNews : getNewsWithFallback;
        const result = await fetchFn(categoryRef.current);

        setNews(result);
        setLastUpdated(new Date());
        // Heuristic: if IDs start with 'live-', data came from API
        setIsLive(result.length > 0 && result[0]!.id.startsWith('live-'));

        log(`Fetched ${result.length} articles`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'खबरें लाने में विफल';
        setError(msg);
        logError('Fetch failed:', err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    []
  );

  // Initial fetch on mount / category change
  useEffect(() => {
    doFetch(false);
  }, [category, doFetch]);

  // Auto-refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      log('Auto-refresh triggered');
      doFetch(false);
    }, REFRESH_INTERVAL_MS);

    log(`Auto-refresh set to ${REFRESH_INTERVAL_MS / 1000}s`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [doFetch]);

  /**
   * Public refresh callback — forces a cache-bypassed fetch.
   */
  const refresh = useCallback(() => {
    log('Manual refresh triggered');
    doFetch(true);
  }, [doFetch]);

  return { news, loading, error, lastUpdated, refresh, isLive };
}

/**
 * Hook that fetches live news once (no auto-refresh).
 * Useful for pages that only need data on mount.
 */
export function useLiveNewsOnce(category?: string): UseLiveNewsResult {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await refreshNews(category);
      setNews(result);
      setLastUpdated(new Date());
      setIsLive(result.length > 0 && result[0]!.id.startsWith('live-'));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'खबरें लाने में विफल';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await getNewsWithFallback(category);
        if (!cancelled) {
          setNews(result);
          setLastUpdated(new Date());
          setIsLive(result.length > 0 && result[0]!.id.startsWith('live-'));
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'खबरें लाने में विफल';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return { news, loading, error, lastUpdated, refresh, isLive };
}

function logError(...args: unknown[]): void {
  if (DEBUG_API) console.error('[useLiveNews]', ...args);
}
