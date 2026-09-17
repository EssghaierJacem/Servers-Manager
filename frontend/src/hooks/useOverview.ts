import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/queryClient';
import type { Overview } from '../lib/types';

export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: () => apiClient.get<Overview>('/overview'),
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}
