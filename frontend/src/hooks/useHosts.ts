import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS, PENDING_SETUP_POLL_INTERVAL_MS } from '../lib/queryClient';
import type {
  CheckTriggeredResponse,
  CreateHostRequest,
  CreateHostResponse,
  Host,
  HostDetail,
  Service,
  SetupInstructions,
} from '../lib/types';

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
    // A host still finishing setup is actionable right now, so poll it
    // faster than the default until it moves past pending_setup.
    refetchInterval: (query) =>
      query.state.data?.status === 'pending_setup'
        ? PENDING_SETUP_POLL_INTERVAL_MS
        : DEFAULT_POLL_INTERVAL_MS,
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

export function useCreateHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHostRequest) => apiClient.post<CreateHostResponse>('/hosts', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useSetupInstructions(hostId: string | undefined) {
  return useQuery({
    queryKey: ['hosts', hostId, 'setup-instructions'],
    queryFn: () => apiClient.get<SetupInstructions>(`/hosts/${hostId}/setup-instructions`),
    enabled: hostId !== undefined,
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
