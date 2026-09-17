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
/** A pending_setup host is actionable right now (paste + verify), so poll it faster. */
export const PENDING_SETUP_POLL_INTERVAL_MS = 3_000;
