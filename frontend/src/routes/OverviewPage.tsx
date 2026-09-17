import { Link } from 'react-router-dom';
import { useHosts } from '../hooks/useHosts';
import { useDomains } from '../hooks/useDomains';
import { useOverview } from '../hooks/useOverview';
import { useAllServices } from '../hooks/useAllServices';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { StatCard } from '../components/StatCard';
import { StatusBreakdownBar } from '../components/StatusBreakdownBar';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { ClockIcon, DomainsIcon, HostsIcon, InboxIcon, OverviewIcon } from '../components/icons';
import { formatRelativeToNow } from '../lib/formatters';
import type { Domain } from '../lib/types';

function upcomingExpirations(domains: Domain[]): Domain[] {
  return domains
    .filter((d) => d.domain_expires_at !== null)
    .sort(
      (a, b) =>
        Date.parse(a.domain_expires_at as string) - Date.parse(b.domain_expires_at as string),
    )
    .slice(0, 5);
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-3 h-3.5 w-16" />
            <Skeleton className="h-7 w-12" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-4 h-3.5 w-24" />
            <Skeleton className="mb-3 h-2.5 w-full" />
            <Skeleton className="h-3.5 w-40" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function OverviewPage() {
  const overview = useOverview();
  const hosts = useHosts();
  const domains = useDomains();
  const services = useAllServices(hosts.data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Overview</h1>
        <p className="text-sm text-text-muted">
          A live snapshot of every host, domain, and service you're monitoring.
        </p>
      </div>

      <AsyncBoundary
        isLoading={overview.isLoading}
        isError={overview.isError}
        data={overview.data}
        loadingFallback={<OverviewSkeleton />}
      >
        {(data) => (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Hosts" value={data.total_hosts} icon={<HostsIcon />} />
              <StatCard label="Domains" value={data.domains_total} icon={<DomainsIcon />} />
              <StatCard label="Services" value={data.services_total} icon={<OverviewIcon />} />
              <StatCard
                label="Needs attention"
                value={
                  data.degraded +
                  data.unreachable +
                  data.unhealthy +
                  data.crash_loop +
                  data.ssl_expired +
                  data.ssl_invalid +
                  data.domains_not_resolving
                }
                tone="critical"
                icon={<OverviewIcon />}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="p-5">
                <StatusBreakdownBar
                  title="Host status"
                  segments={[
                    { key: 'healthy', label: 'Healthy', value: data.healthy, colorKey: 'healthy' },
                    {
                      key: 'degraded',
                      label: 'Degraded',
                      value: data.degraded,
                      colorKey: 'warning',
                    },
                    {
                      key: 'unreachable',
                      label: 'Unreachable',
                      value: data.unreachable,
                      colorKey: 'critical',
                    },
                    {
                      key: 'pending_setup',
                      label: 'Pending setup',
                      value: data.pending_setup,
                      colorKey: 'unknown',
                    },
                    { key: 'unknown', label: 'Unknown', value: data.unknown, colorKey: 'unknown' },
                  ]}
                />
              </Card>

              <Card className="p-5">
                <StatusBreakdownBar
                  title="Service status"
                  segments={[
                    { key: 'running', label: 'Running', value: data.running, colorKey: 'healthy' },
                    {
                      key: 'unhealthy',
                      label: 'Unhealthy',
                      value: data.unhealthy,
                      colorKey: 'critical',
                    },
                    {
                      key: 'crash_loop',
                      label: 'Crash loop',
                      value: data.crash_loop,
                      colorKey: 'critical',
                    },
                    { key: 'stopped', label: 'Stopped', value: data.stopped, colorKey: 'unknown' },
                    {
                      key: 'unknown',
                      label: 'Unknown',
                      value: data.services_unknown,
                      colorKey: 'unknown',
                    },
                  ]}
                />
              </Card>

              <Card className="p-5">
                <StatusBreakdownBar
                  title="SSL certificate status"
                  segments={[
                    { key: 'valid', label: 'Valid', value: data.ssl_valid, colorKey: 'healthy' },
                    {
                      key: 'expiring_soon',
                      label: 'Expiring soon',
                      value: data.ssl_expiring_soon,
                      colorKey: 'warning',
                    },
                    {
                      key: 'expired',
                      label: 'Expired',
                      value: data.ssl_expired,
                      colorKey: 'critical',
                    },
                    {
                      key: 'invalid',
                      label: 'Invalid',
                      value: data.ssl_invalid,
                      colorKey: 'critical',
                    },
                    {
                      key: 'unknown',
                      label: 'Unknown',
                      value: Math.max(
                        0,
                        data.domains_total -
                          data.ssl_valid -
                          data.ssl_expiring_soon -
                          data.ssl_expired -
                          data.ssl_invalid,
                      ),
                      colorKey: 'unknown',
                    },
                  ]}
                />
              </Card>
            </div>
          </>
        )}
      </AsyncBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-medium text-text-primary">
              Hosts <span className="text-text-muted">({hosts.data?.length ?? 0})</span>
            </h2>
            <Link
              to="/hosts"
              className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
            >
              View all →
            </Link>
          </div>
          <AsyncBoundary isLoading={hosts.isLoading} isError={hosts.isError} data={hosts.data}>
            {(rows) => (
              <BoardTable
                rows={rows.slice(0, 6)}
                emptyState={
                  <EmptyState
                    icon={<HostsIcon className="h-full w-full" />}
                    title="No hosts yet"
                    description="Add a host to start seeing its status here."
                  />
                }
                keyFn={(h) => h.id}
                columns={[
                  {
                    header: 'Name',
                    render: (h) => (
                      <Link
                        to={`/hosts/${h.id}`}
                        className="font-mono font-medium text-text-primary hover:text-accent"
                      >
                        {h.name}
                      </Link>
                    ),
                  },
                  { header: 'Provider', render: (h) => h.provider },
                  {
                    header: 'IP address',
                    render: (h) => <span className="font-mono">{h.ip_address}</span>,
                  },
                  { header: 'Status', render: (h) => <StatusDot status={h.status} /> },
                  {
                    header: 'Last checked',
                    render: (h) => formatRelativeToNow(h.last_checked_at),
                  },
                ]}
              />
            )}
          </AsyncBoundary>
        </Card>

        <Card className="flex flex-col">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-medium text-text-primary">Upcoming domain expirations</h2>
          </div>
          <AsyncBoundary
            isLoading={domains.isLoading}
            isError={domains.isError}
            data={domains.data}
          >
            {(rows) => {
              const upcoming = upcomingExpirations(rows);
              if (upcoming.length === 0) {
                return (
                  <EmptyState
                    icon={<ClockIcon className="h-full w-full" />}
                    title="Nothing expiring soon"
                    description="Domains with a known expiration date will be listed here."
                  />
                );
              }
              return (
                <ul className="divide-y divide-border">
                  {upcoming.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between px-5 py-3.5 text-sm"
                    >
                      <Link
                        to={`/domains/${d.id}`}
                        className="font-mono font-medium text-text-primary hover:text-accent"
                      >
                        {d.hostname}
                      </Link>
                      <span className="text-text-muted">
                        {formatRelativeToNow(d.domain_expires_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            }}
          </AsyncBoundary>
        </Card>
      </div>

      <Card className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-medium text-text-primary">
            Services <span className="text-text-muted">({services.data?.length ?? 0})</span>
          </h2>
          <Link
            to="/services"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
          >
            View all →
          </Link>
        </div>
        <AsyncBoundary
          isLoading={services.isLoading}
          isError={services.isError}
          data={services.data}
        >
          {(rows) => (
            <BoardTable
              rows={rows.slice(0, 8)}
              emptyState={
                <EmptyState
                  icon={<InboxIcon className="h-full w-full" />}
                  title="No containers discovered yet"
                  description="Services are discovered automatically the first time each host is checked."
                />
              }
              keyFn={(s) => s.id}
              columns={[
                {
                  header: 'Container',
                  render: (s) => (
                    <Link
                      to={`/services/${s.id}`}
                      className="font-mono font-medium text-text-primary hover:text-accent"
                    >
                      {s.container_name}
                    </Link>
                  ),
                },
                {
                  header: 'Image',
                  render: (s) => (
                    <span className="font-mono">
                      {s.image}
                      {s.current_tag ? `:${s.current_tag}` : ''}
                    </span>
                  ),
                },
                { header: 'Host', render: (s) => s.host_name },
                { header: 'Status', render: (s) => <StatusDot status={s.status} /> },
              ]}
            />
          )}
        </AsyncBoundary>
      </Card>
    </div>
  );
}
