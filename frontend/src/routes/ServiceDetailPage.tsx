import { Link, useParams } from 'react-router-dom';
import { useService, useServiceSnapshots, useTriggerServiceCheck } from '../hooks/useServices';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { SectionHeader } from '../components/SectionHeader';
import { StatusDot } from '../components/StatusDot';
import { BoardTable } from '../components/BoardTable';
import { CheckNowButton } from '../components/CheckNowButton';
import { HealthLogList } from '../components/HealthLogList';
import { Field } from '../components/Field';
import { RollbackPanel } from '../components/RollbackPanel';
import { formatTimestamp } from '../lib/formatters';

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const service = useService(id);
  const snapshots = useServiceSnapshots(id);
  const triggerCheck = useTriggerServiceCheck(id ?? '');

  return (
    <div className="flex flex-col gap-10">
      <AsyncBoundary isLoading={service.isLoading} isError={service.isError} data={service.data}>
        {(data) => (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="font-mono text-xl text-text-primary">{data.container_name}</h1>
                <CheckNowButton
                  onCheck={() => triggerCheck.mutate()}
                  isPending={triggerCheck.isPending}
                />
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border border-border p-4 text-sm sm:grid-cols-4">
                <Field label="Status" value={<StatusDot status={data.status} />} />
                <Field
                  label="Image"
                  value={
                    <span className="font-mono">
                      {data.image}
                      {data.current_tag ? `:${data.current_tag}` : ''}
                    </span>
                  }
                />
                <Field
                  label="Container ID"
                  value={<span className="font-mono">{data.container_id}</span>}
                />
                <Field
                  label="Host"
                  value={
                    <Link to={`/hosts/${data.host_id}`} className="text-accent">
                      view host
                    </Link>
                  }
                />
                <Field label="Last checked" value={formatTimestamp(data.last_checked_at)} />
              </dl>
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeader title="Roll back" />
              <AsyncBoundary
                isLoading={snapshots.isLoading}
                isError={snapshots.isError}
                data={snapshots.data}
              >
                {(snapshotRows) => (
                  <RollbackPanel
                    serviceId={data.id}
                    currentImageTag={`${data.image}${data.current_tag ? `:${data.current_tag}` : ''}`}
                    snapshots={snapshotRows}
                  />
                )}
              </AsyncBoundary>
            </section>

            <section className="flex flex-col gap-2">
              <SectionHeader title="Deployment history" count={snapshots.data?.length} />
              <AsyncBoundary
                isLoading={snapshots.isLoading}
                isError={snapshots.isError}
                data={snapshots.data}
              >
                {(rows) => (
                  <BoardTable
                    rows={rows}
                    emptyLabel="No deployment history captured yet."
                    keyFn={(s) => s.id}
                    columns={[
                      {
                        header: 'Image',
                        render: (s) => <span className="font-mono">{s.image_tag}</span>,
                      },
                      {
                        header: 'Current',
                        render: (s) =>
                          s.is_current ? <StatusDot status="running" label="current" /> : '',
                      },
                      { header: 'Deployed at', render: (s) => formatTimestamp(s.deployed_at) },
                      {
                        header: 'Deployed by',
                        render: (s) =>
                          s.deployed_by ? (
                            <span className="font-mono">{s.deployed_by}</span>
                          ) : (
                            'automatic'
                          ),
                      },
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
