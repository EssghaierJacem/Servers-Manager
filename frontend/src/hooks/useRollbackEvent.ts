import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { ROLLBACK_POLL_INTERVAL_MS } from '../lib/queryClient';
import type { RollbackEvent } from '../lib/types';

const TERMINAL_STATUSES = new Set(['succeeded', 'failed']);

export function useRollbackEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['rollback-events', id],
    queryFn: () => apiClient.get<RollbackEvent>(`/rollback-events/${id}`),
    enabled: id !== undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.has(status)) {
        return false;
      }
      return ROLLBACK_POLL_INTERVAL_MS;
    },
  });
}
