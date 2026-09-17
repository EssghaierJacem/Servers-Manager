import { useParams } from 'react-router-dom';
import { useDomain, useTriggerDomainCheck } from '../hooks/useDomains';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { SectionHeader } from '../components/SectionHeader';
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
    <div className="flex flex-col gap-10">
      <AsyncBoundary isLoading={domain.isLoading} isError={domain.isError} data={domain.data}>
        {(data) => (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="font-mono text-xl text-text-primary">{data.hostname}</h1>
                <CheckNowButton
                  onCheck={() => triggerCheck.mutate()}
                  isPending={triggerCheck.isPending}
                />
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border border-border p-4 text-sm sm:grid-cols-4">
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
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeader title="SSL certificate" />
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border border-border p-4 text-sm sm:grid-cols-4">
                <Field label="Status" value={<StatusDot status={data.ssl_certificate.status} />} />
                <Field label="Issuer" value={data.ssl_certificate.issuer ?? '-'} />
                <Field
                  label="Valid from"
                  value={formatTimestamp(data.ssl_certificate.valid_from)}
                />
                <Field label="Valid to" value={formatTimestamp(data.ssl_certificate.valid_to)} />
              </dl>
            </section>

            <section className="flex flex-col gap-2">
              <SectionHeader title="Check history" />
              <HealthLogList logs={data.recent_logs} />
            </section>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
