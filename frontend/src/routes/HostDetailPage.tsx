import { Link, useParams } from 'react-router-dom';
import { useHost, useHostServices, useTriggerHostCheck } from '../hooks/useHosts';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { BackLink } from '../components/BackLink';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { CheckNowButton } from '../components/CheckNowButton';
import { HealthLogList } from '../components/HealthLogList';
import { SetupInstructionsPanel } from '../components/SetupInstructionsPanel';
import { Field } from '../components/Field';
import { InboxIcon } from '../components/icons';
import { formatTimestamp } from '../lib/formatters';

export function HostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const host = useHost(id);
  const services = useHostServices(id);
  const triggerCheck = useTriggerHostCheck(id ?? '');

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/hosts" label="Back to hosts" />

      <AsyncBoundary isLoading={host.isLoading} isError={host.isError} data={host.data}>
        {(data) =>
          data.status === 'pending_setup' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-2xl font-semibold tracking-tight text-text-primary">
                  {data.name}
                </h1>
                <StatusDot status={data.status} />
              </div>
              <SetupInstructionsPanel
                hostId={data.id}
                hostName={data.name}
                lastLog={data.recent_logs[0]}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h1 className="font-mono text-2xl font-semibold tracking-tight text-text-primary">
                  {data.name}
                </h1>
                <CheckNowButton
                  onCheck={() => triggerCheck.mutate()}
                  isPending={triggerCheck.isPending}
                />
              </div>

              <Card className="p-5">
                <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
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
              </Card>

              <Card className="flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="font-medium text-text-primary">Services</h2>
                  <span className="text-sm text-text-muted">{services.data?.length ?? 0}</span>
                </div>
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
                          title="No containers yet"
                          description="Containers running on this host will be listed here once discovered."
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
                        { header: 'Status', render: (s) => <StatusDot status={s.status} /> },
                        {
                          header: 'Last checked',
                          render: (s) => formatTimestamp(s.last_checked_at),
                        },
                      ]}
                    />
                  )}
                </AsyncBoundary>
              </Card>

              <Card className="flex flex-col">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="font-medium text-text-primary">Check history</h2>
                </div>
                <HealthLogList logs={data.recent_logs} />
              </Card>
            </div>
          )
        }
      </AsyncBoundary>
    </div>
  );
}
