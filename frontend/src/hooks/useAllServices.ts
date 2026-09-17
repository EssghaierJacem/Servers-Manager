import { useQueries } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/queryClient';
import type { Host, Service } from '../lib/types';

export interface ServiceWithHost extends Service {
  host_name: string;
}

/**
 * There is no aggregate /services endpoint - services are only listable
 * per host - so the board fetches each host's services in parallel and
 * flattens the result, tagging each row with its host's name for display.
 */
export function useAllServices(hosts: Host[] | undefined) {
  const results = useQueries({
    queries: (hosts ?? []).map((host) => ({
      queryKey: ['hosts', host.id, 'services'],
      queryFn: () => apiClient.get<Service[]>(`/hosts/${host.id}/services`),
      refetchInterval: DEFAULT_POLL_INTERVAL_MS,
    })),
  });

  const isLoading = hosts === undefined || results.some((result) => result.isLoading);
  const isError = results.some((result) => result.isError);
  const services: ServiceWithHost[] | undefined = hosts
    ? results.flatMap((result, index) =>
        (result.data ?? []).map((service) => ({ ...service, host_name: hosts[index].name })),
      )
    : undefined;

  return { data: services, isLoading, isError };
}
