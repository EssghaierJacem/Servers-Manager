import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/queryClient';
import type { CheckTriggeredResponse, Domain, DomainDetail } from '../lib/types';

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: () => apiClient.get<Domain[]>('/domains'),
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useDomain(id: string | undefined) {
  return useQuery({
    queryKey: ['domains', id],
    queryFn: () => apiClient.get<DomainDetail>(`/domains/${id}`),
    enabled: id !== undefined,
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useTriggerDomainCheck(domainId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<CheckTriggeredResponse>(`/domains/${domainId}/check`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['domains', domainId] });
    },
  });
}
