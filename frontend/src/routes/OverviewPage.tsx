import { Link } from 'react-router-dom';
import { useHosts } from '../hooks/useHosts';
import { useDomains } from '../hooks/useDomains';
import { useOverview } from '../hooks/useOverview';
import { useAllServices } from '../hooks/useAllServices';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { SectionHeader } from '../components/SectionHeader';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { formatRelativeToNow } from '../lib/formatters';

export function OverviewPage() {
  const overview = useOverview();
  const hosts = useHosts();
  const domains = useDomains();
  const services = useAllServices(hosts.data);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <SectionHeader title="Hosts" count={overview.data?.total_hosts} />
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
                { header: 'Status', render: (h) => <StatusDot status={h.status} /> },
                { header: 'Last checked', render: (h) => formatRelativeToNow(h.last_checked_at) },
              ]}
            />
          )}
        </AsyncBoundary>
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Domains" count={overview.data?.domains_total} />
        <AsyncBoundary isLoading={domains.isLoading} isError={domains.isError} data={domains.data}>
          {(rows) => (
            <BoardTable
              rows={rows}
              emptyLabel="No domains registered yet."
              keyFn={(d) => d.id}
              columns={[
                {
                  header: 'Hostname',
                  render: (d) => (
                    <Link to={`/domains/${d.id}`} className="font-mono text-accent">
                      {d.hostname}
                    </Link>
                  ),
                },
                { header: 'DNS', render: (d) => <StatusDot status={d.dns_status} /> },
                { header: 'SSL', render: (d) => <StatusDot status={d.ssl_status} /> },
                { header: 'Expires', render: (d) => formatRelativeToNow(d.domain_expires_at) },
              ]}
            />
          )}
        </AsyncBoundary>
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Services" count={overview.data?.services_total} />
        <AsyncBoundary
          isLoading={services.isLoading}
          isError={services.isError}
          data={services.data}
        >
          {(rows) => (
            <BoardTable
              rows={rows}
              emptyLabel="No containers discovered yet."
              keyFn={(s) => s.id}
              columns={[
                {
                  header: 'Container',
                  render: (s) => (
                    <Link to={`/services/${s.id}`} className="font-mono text-accent">
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
      </section>
    </div>
  );
}
