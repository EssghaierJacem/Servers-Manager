import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/queryClient';
import type {
  CheckTriggeredResponse,
  DeploymentSnapshot,
  RollbackTriggeredResponse,
  ServiceDetail,
} from '../lib/types';

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => apiClient.get<ServiceDetail>(`/services/${id}`),
    enabled: id !== undefined,
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useServiceSnapshots(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['services', serviceId, 'snapshots'],
    queryFn: () => apiClient.get<DeploymentSnapshot[]>(`/services/${serviceId}/snapshots`),
    enabled: serviceId !== undefined,
    refetchInterval: DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useTriggerServiceCheck(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<CheckTriggeredResponse>(`/services/${serviceId}/check`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services', serviceId] });
    },
  });
}

export function useTriggerRollback(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetSnapshotId: string) =>
      apiClient.post<RollbackTriggeredResponse>(`/services/${serviceId}/rollback`, {
        target_snapshot_id: targetSnapshotId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services', serviceId, 'snapshots'] });
    },
  });
}
