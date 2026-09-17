import { Link } from 'react-router-dom';
import { useDomains } from '../hooks/useDomains';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { formatTimestamp } from '../lib/formatters';

export function DomainsListPage() {
  const domains = useDomains();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl text-text-primary">
        Domains <span className="text-text-muted">({domains.data?.length ?? 0})</span>
      </h1>

      <Card className="flex flex-col">
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
      </Card>
    </div>
  );
}
