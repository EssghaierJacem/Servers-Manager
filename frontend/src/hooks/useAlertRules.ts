import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { AlertRule, CreateAlertRuleRequest } from '../lib/types';

export function useAlertRules() {
  return useQuery({
    queryKey: ['alert-rules'],
    queryFn: () => apiClient.get<AlertRule[]>('/alert-rules'),
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlertRuleRequest) => apiClient.post<AlertRule>('/alert-rules', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

export function useSetAlertRuleEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiClient.patch<AlertRule>(`/alert-rules/${id}`, { enabled }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/alert-rules/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}
