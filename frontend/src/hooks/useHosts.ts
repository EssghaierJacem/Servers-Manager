import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/queryClient';
import type { CheckTriggeredResponse, Host, HostDetail, Service } from '../lib/types';

export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: () => apiClient.get<Host[]>('/hosts'),
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useHost(id: string | undefined) {
  return useQuery({
    queryKey: ['hosts', id],
    queryFn: () => apiClient.get<HostDetail>(`/hosts/${id}`),
    enabled: id !== undefined,
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useHostServices(hostId: string | undefined) {
  return useQuery({
    queryKey: ['hosts', hostId, 'services'],
    queryFn: () => apiClient.get<Service[]>(`/hosts/${hostId}/services`),
    enabled: hostId !== undefined,
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useTriggerHostCheck(hostId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<CheckTriggeredResponse>(`/hosts/${hostId}/check`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hosts', hostId] });
      void queryClient.invalidateQueries({ queryKey: ['hosts', hostId, 'services'] });
    },
  });
}
