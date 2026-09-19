import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { CloudAccount, ConnectCloudAccountRequest } from '../lib/types';

export function useCloudAccounts() {
  return useQuery({
    queryKey: ['cloud-accounts'],
    queryFn: () => apiClient.get<CloudAccount[]>('/cloud-accounts'),
  });
}

export function useConnectCloudAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectCloudAccountRequest) =>
      apiClient.post<CloudAccount>('/cloud-accounts', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cloud-accounts'] });
    },
  });
}

export function useDisconnectCloudAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cloud-accounts/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cloud-accounts'] });
    },
  });
}
