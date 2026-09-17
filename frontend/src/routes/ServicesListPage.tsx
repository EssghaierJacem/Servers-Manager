import { Link } from 'react-router-dom';
import { useHosts } from '../hooks/useHosts';
import { useAllServices } from '../hooks/useAllServices';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { InboxIcon } from '../components/icons';
import { formatTimestamp } from '../lib/formatters';

export function ServicesListPage() {
  const hosts = useHosts();
  const services = useAllServices(hosts.data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Services <span className="text-text-muted">({services.data?.length ?? 0})</span>
        </h1>
        <p className="text-sm text-text-muted">
          Every container discovered across all of your hosts.
        </p>
      </div>

      <Card className="flex flex-col">
        <AsyncBoundary
          isLoading={services.isLoading}
          isError={services.isError}
          data={services.data}
        >
          {(rows) => (
            <BoardTable
              rows={rows}
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
                {
                  header: 'Host',
                  render: (s) => <span className="text-text-secondary">{s.host_name}</span>,
                },
                { header: 'Status', render: (s) => <StatusDot status={s.status} /> },
                { header: 'Last checked', render: (s) => formatTimestamp(s.last_checked_at) },
              ]}
            />
          )}
        </AsyncBoundary>
      </Card>
    </div>
  );
}
