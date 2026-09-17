import { useState } from 'react';
import { PressHoldButton } from './PressHoldButton';
import { StatusDot } from './StatusDot';
import { useRollbackEvent } from '../hooks/useRollbackEvent';
import { useTriggerRollback } from '../hooks/useServices';
import { formatTimestamp } from '../lib/formatters';
import type { DeploymentSnapshot } from '../lib/types';

interface RollbackPanelProps {
  serviceId: string;
  currentImageTag: string;
  snapshots: DeploymentSnapshot[];
}

export function RollbackPanel({ serviceId, currentImageTag, snapshots }: RollbackPanelProps) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [rollbackEventId, setRollbackEventId] = useState<string | null>(null);

  const triggerRollback = useTriggerRollback(serviceId);
  const rollbackEvent = useRollbackEvent(rollbackEventId ?? undefined);

  const targetSnapshot = snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null;
  const rollbackableSnapshots = snapshots.filter((snapshot) => !snapshot.is_current);

  const handleConfirm = (): void => {
    if (!targetSnapshot) return;
    triggerRollback.mutate(targetSnapshot.id, {
      onSuccess: (response) => setRollbackEventId(response.rollback_event_id),
    });
  };

  if (rollbackEventId) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-text-primary">Rollback in progress</span>
          {rollbackEvent.data && <StatusDot status={rollbackEvent.data.status} />}
        </div>
        <ul className="flex flex-col gap-1 font-mono text-xs text-text-muted">
          {(rollbackEvent.data?.log_output ?? []).map((entry, index) => (
            <li key={index} className="border-b border-border py-1 last:border-b-0">
              <span className="text-text-primary">{entry.step}</span>
              {entry.command && <div>$ {entry.command}</div>}
              {entry.exit_code !== undefined && entry.exit_code !== null && (
                <div>exit code: {entry.exit_code}</div>
              )}
              {entry.stdout && <div className="whitespace-pre-wrap">{entry.stdout}</div>}
              {entry.stderr && (
                <div className="whitespace-pre-wrap text-status-warning">{entry.stderr}</div>
              )}
              {entry.message && <div>{entry.message}</div>}
            </li>
          ))}
        </ul>
        {rollbackEvent.data?.status === 'succeeded' && (
          <p className="text-sm text-status-healthy">Rollback succeeded.</p>
        )}
        {rollbackEvent.data?.status === 'failed' && (
          <p className="text-sm text-status-critical">Rollback failed. See the log above.</p>
        )}
        {(rollbackEvent.data?.status === 'succeeded' ||
          rollbackEvent.data?.status === 'failed') && (
          <button
            type="button"
            onClick={() => {
              setRollbackEventId(null);
              setSelectedSnapshotId('');
            }}
            className="self-start rounded border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text-primary"
          >
            Start another rollback
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-text-muted">Roll back to</span>
        <select
          value={selectedSnapshotId}
          onChange={(event) => setSelectedSnapshotId(event.target.value)}
          className="rounded border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus-visible:border-accent"
        >
          <option value="">Select a previous deployment...</option>
          {rollbackableSnapshots.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>
              {snapshot.image_tag} - deployed {formatTimestamp(snapshot.deployed_at)}
            </option>
          ))}
        </select>
      </label>

      {targetSnapshot && (
        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <p className="font-mono text-sm text-text-primary">
            {currentImageTag} <span className="text-text-muted">to</span> {targetSnapshot.image_tag}
          </p>
          <p className="text-sm text-text-muted">
            This stops and recreates the running container. A post-rollback health check must pass
            for it to be marked a success.
          </p>
          <PressHoldButton
            label="Hold to roll back"
            holdingLabel="Rolling back..."
            onConfirm={handleConfirm}
          />
        </div>
      )}
    </div>
  );
}
