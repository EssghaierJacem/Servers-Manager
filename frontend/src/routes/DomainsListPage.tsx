import { Link } from 'react-router-dom';
import { useDomains } from '../hooks/useDomains';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { SectionHeader } from '../components/SectionHeader';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { formatTimestamp } from '../lib/formatters';

export function DomainsListPage() {
  const domains = useDomains();

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title="Domains" count={domains.data?.length} />
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
              { header: 'DNS status', render: (d) => <StatusDot status={d.dns_status} /> },
              { header: 'SSL status', render: (d) => <StatusDot status={d.ssl_status} /> },
              {
                header: 'Resolved IP',
                render: (d) => <span className="font-mono">{d.resolved_ip ?? '-'}</span>,
              },
              { header: 'Expires', render: (d) => formatTimestamp(d.domain_expires_at) },
              { header: 'Last checked', render: (d) => formatTimestamp(d.last_checked_at) },
            ]}
          />
        )}
      </AsyncBoundary>
    </div>
  );
}
