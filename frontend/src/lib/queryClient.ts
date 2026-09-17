import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Default poll interval for list/detail views - there is no WebSocket yet. */
export const DEFAULT_POLL_INTERVAL_MS = 30_000;
export const ROLLBACK_POLL_INTERVAL_MS = 2_000;
