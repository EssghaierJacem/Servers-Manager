import { Link, useParams } from 'react-router-dom';
import { useHost, useHostServices, useTriggerHostCheck } from '../hooks/useHosts';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { SectionHeader } from '../components/SectionHeader';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { CheckNowButton } from '../components/CheckNowButton';
import { HealthLogList } from '../components/HealthLogList';
import { Field } from '../components/Field';
import { formatTimestamp } from '../lib/formatters';

export function HostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const host = useHost(id);
  const services = useHostServices(id);
  const triggerCheck = useTriggerHostCheck(id ?? '');

  return (
    <div className="flex flex-col gap-10">
      <AsyncBoundary isLoading={host.isLoading} isError={host.isError} data={host.data}>
        {(data) => (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="font-mono text-xl text-text-primary">{data.name}</h1>
                <CheckNowButton
                  onCheck={() => triggerCheck.mutate()}
                  isPending={triggerCheck.isPending}
                />
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border border-border p-4 text-sm sm:grid-cols-4">
                <Field label="Status" value={<StatusDot status={data.status} />} />
                <Field label="Provider" value={data.provider} />
                <Field
                  label="IP address"
                  value={<span className="font-mono">{data.ip_address}</span>}
                />
                <Field
                  label="SSH"
                  value={
                    <span className="font-mono">
                      {data.ssh_user}@:{data.ssh_port}
                    </span>
                  }
                />
                <Field label="Last checked" value={formatTimestamp(data.last_checked_at)} />
                <Field label="Registered" value={formatTimestamp(data.created_at)} />
              </dl>
            </section>

            <section className="flex flex-col gap-2">
              <SectionHeader title="Services" count={services.data?.length} />
              <AsyncBoundary
                isLoading={services.isLoading}
                isError={services.isError}
                data={services.data}
              >
                {(rows) => (
                  <BoardTable
                    rows={rows}
                    emptyLabel="No containers discovered on this host yet."
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
                      { header: 'Status', render: (s) => <StatusDot status={s.status} /> },
                      { header: 'Last checked', render: (s) => formatTimestamp(s.last_checked_at) },
                    ]}
                  />
                )}
              </AsyncBoundary>
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
