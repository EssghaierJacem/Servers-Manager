import { Link } from 'react-router-dom';
import { useDomains } from '../hooks/useDomains';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { CertificateIcon } from '../components/icons';
import { formatRelativeToNow } from '../lib/formatters';
import type { Domain, SslCertificateStatus } from '../lib/types';

const SEVERITY_ORDER: Record<SslCertificateStatus, number> = {
  expired: 0,
  invalid: 1,
  expiring_soon: 2,
  unknown: 3,
  valid: 4,
};

function bySeverity(domains: Domain[]): Domain[] {
  return [...domains].sort((a, b) => SEVERITY_ORDER[a.ssl_status] - SEVERITY_ORDER[b.ssl_status]);
}

export function CertificatesPage() {
  const domains = useDomains();
  const total = domains.data?.length ?? 0;
  const needsAttention =
    domains.data?.filter((d) => d.ssl_status === 'expired' || d.ssl_status === 'invalid').length ??
    0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-text-primary">
          <CertificateIcon className="h-6 w-6 text-accent" />
          SSL certificates
        </h1>
        <p className="text-sm text-text-muted">
          Every domain's certificate status in one place, worst first -{' '}
          {needsAttention > 0 ? (
            <span className="font-medium text-status-critical">
              {needsAttention} need{needsAttention === 1 ? 's' : ''} attention
            </span>
          ) : (
            'nothing expired or invalid'
          )}{' '}
          out of {total}.
        </p>
      </div>

      <Card className="flex flex-col">
        <AsyncBoundary isLoading={domains.isLoading} isError={domains.isError} data={domains.data}>
          {(rows) => (
            <BoardTable
              rows={bySeverity(rows)}
              emptyState={
                <EmptyState
                  icon={<CertificateIcon className="h-full w-full" />}
                  title="No domains yet"
                  description="Add a domain to start tracking its SSL certificate here."
                />
              }
              keyFn={(d) => d.id}
              columns={[
                {
                  header: 'Domain',
                  render: (d) => (
                    <Link
                      to={`/domains/${d.id}`}
                      className="font-mono font-medium text-text-primary hover:text-accent"
                    >
                      {d.hostname}
                    </Link>
                  ),
                },
                {
                  header: 'Certificate',
                  render: (d) => <StatusDot status={d.ssl_status} />,
                },
                { header: 'DNS', render: (d) => <StatusDot status={d.dns_status} /> },
                {
                  header: 'Domain expires',
                  render: (d) =>
                    d.domain_expires_at ? formatRelativeToNow(d.domain_expires_at) : '—',
                },
                {
                  header: 'Last checked',
                  render: (d) => formatRelativeToNow(d.last_checked_at),
                },
              ]}
            />
          )}
        </AsyncBoundary>
      </Card>
    </div>
  );
}
