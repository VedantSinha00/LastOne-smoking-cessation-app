import { QueryClient } from "@tanstack/react-query";

/**
 * Global query defaults. The library defaults (staleTime: 0,
 * refetchOnWindowFocus: true, retry: 3) are too aggressive for a mobile app:
 * every screen mount and every app-foreground refetches all visible queries,
 * producing a re-render burst that can stall the JS thread for a few hundred ms
 * — long enough that a tap during that window appears to be ignored (the
 * "press twice" feeling). These defaults cut that churn; hooks that need fresher
 * data still override staleTime per-query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for a minute → revisiting a screen within that
      // window reads cache instead of refetching + re-rendering.
      staleTime: 60_000,
      // In RN this fires on every AppState foreground; a blanket refetch on
      // every app-switch is the main source of focus-time jank.
      refetchOnWindowFocus: false,
      // Don't grind through 3 retries (the default) on a slow/dev network —
      // each failed attempt re-renders the consumer.
      retry: 1,
    },
  },
});
