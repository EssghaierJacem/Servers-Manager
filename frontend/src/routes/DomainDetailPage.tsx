import { useParams } from 'react-router-dom';
import { useDomain, useTriggerDomainCheck } from '../hooks/useDomains';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { StatusDot } from '../components/StatusDot';
import { CheckNowButton } from '../components/CheckNowButton';
import { HealthLogList } from '../components/HealthLogList';
import { Field } from '../components/Field';
import { formatTimestamp } from '../lib/formatters';

export function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const domain = useDomain(id);
  const triggerCheck = useTriggerDomainCheck(id ?? '');

  return (
    <div className="flex flex-col gap-8">
      <AsyncBoundary isLoading={domain.isLoading} isError={domain.isError} data={domain.data}>
        {(data) => (
          <>
            <div className="flex items-center justify-between">
              <h1 className="font-mono text-xl text-text-primary">{data.hostname}</h1>
              <CheckNowButton
                onCheck={() => triggerCheck.mutate()}
                isPending={triggerCheck.isPending}
              />
            </div>

            <Card className="p-5">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-4">
                <Field label="DNS status" value={<StatusDot status={data.dns_status} />} />
                <Field
                  label="Resolved IP"
                  value={<span className="font-mono">{data.resolved_ip ?? '-'}</span>}
                />
                <Field label="Registrar" value={data.registrar ?? '-'} />
                <Field label="Domain expires" value={formatTimestamp(data.domain_expires_at)} />
                <Field label="Last checked" value={formatTimestamp(data.last_checked_at)} />
                <Field label="Registered" value={formatTimestamp(data.created_at)} />
              </dl>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-text-primary">SSL certificate</h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-4">
                <Field label="Status" value={<StatusDot status={data.ssl_certificate.status} />} />
                <Field label="Issuer" value={data.ssl_certificate.issuer ?? '-'} />
                <Field
                  label="Valid from"
                  value={formatTimestamp(data.ssl_certificate.valid_from)}
                />
                <Field label="Valid to" value={formatTimestamp(data.ssl_certificate.valid_to)} />
              </dl>
            </Card>

            <Card className="flex flex-col">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-text-primary">Check history</h2>
              </div>
              <HealthLogList logs={data.recent_logs} />
            </Card>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
