import { Link } from 'react-router-dom';
import { useHosts } from '../hooks/useHosts';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { PlusIcon } from '../components/icons';
import { formatTimestamp } from '../lib/formatters';

export function HostsListPage() {
  const hosts = useHosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-text-primary">
          Hosts <span className="text-text-muted">({hosts.data?.length ?? 0})</span>
        </h1>
        <Link
          to="/hosts/new"
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-bg-base hover:bg-accent/90"
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
              emptyLabel="No hosts registered yet."
              keyFn={(h) => h.id}
              columns={[
                {
                  header: 'Name',
                  render: (h) => (
                    <Link to={`/hosts/${h.id}`} className="font-mono text-accent">
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
