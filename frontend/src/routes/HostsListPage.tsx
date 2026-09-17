import { Link } from 'react-router-dom';
import { useHosts } from '../hooks/useHosts';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { SectionHeader } from '../components/SectionHeader';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { formatTimestamp } from '../lib/formatters';

export function HostsListPage() {
  const hosts = useHosts();

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title="Hosts" count={hosts.data?.length} />
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
    </div>
  );
}
