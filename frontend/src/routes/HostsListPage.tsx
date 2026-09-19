import { Link } from 'react-router-dom';
import { useHosts } from '../hooks/useHosts';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { HostsIcon, PlusIcon } from '../components/icons';
import { formatTimestamp } from '../lib/formatters';

export function HostsListPage() {
  const hosts = useHosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Hosts <span className="text-text-muted">({hosts.data?.length ?? 0})</span>
          </h1>
          <p className="text-sm text-text-muted">
            Every server connected to Servers-Manager, and its live SSH health.
          </p>
        </div>
        <Link
          to="/hosts/new"
          className="flex shrink-0 items-center gap-1.5 rounded-lg btn-gradient px-3.5 py-2.5 text-sm font-medium shadow-card transition-all duration-150 ease-smooth hover:-translate-y-px hover:shadow-popover active:translate-y-0"
        >
          <PlusIcon className="h-4 w-4" />
          Add host
        </Link>
      </div>

      <Card className="flex flex-col">
        <AsyncBoundary isLoading={hosts.isLoading} isError={hosts.isError} data={hosts.data}>
          {(rows) => (
            <BoardTable
              rows={rows}
              emptyState={
                <EmptyState
                  icon={<HostsIcon className="h-full w-full" />}
                  title="No hosts yet"
                  description="Connect your first server to start monitoring its health, containers, and deployments."
                  action={
                    <Link
                      to="/hosts/new"
                      className="mt-1 rounded-lg btn-gradient px-3.5 py-2 text-sm font-medium shadow-card transition-all duration-150 ease-smooth hover:-translate-y-px hover:shadow-popover active:translate-y-0"
                    >
                      Add your first host
                    </Link>
                  }
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
                {
                  header: 'SSH',
                  render: (h) => (
                    <span className="font-mono">
                      {h.ssh_user}@:{h.ssh_port}
                    </span>
                  ),
                },
                { header: 'Status', render: (h) => <StatusDot status={h.status} /> },
                { header: 'Last checked', render: (h) => formatTimestamp(h.last_checked_at) },
              ]}
            />
          )}
        </AsyncBoundary>
      </Card>
    </div>
  );
}
