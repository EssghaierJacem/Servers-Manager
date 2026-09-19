import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/queryClient';
import type { Insights } from '../lib/types';

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => apiClient.get<Insights>('/insights'),
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}
