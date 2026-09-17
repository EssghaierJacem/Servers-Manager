import { useSetupInstructions, useTriggerHostCheck } from '../hooks/useHosts';
import { AsyncBoundary } from './AsyncBoundary';
import { Card } from './Card';
import { CheckNowButton } from './CheckNowButton';
import { CopyButton } from './CopyButton';
import type { HealthCheckLog } from '../lib/types';

function isKeyNotInstalledYet(lastLog: HealthCheckLog | undefined): boolean {
  return lastLog?.raw_output.reason === 'key_not_installed';
}

interface SetupInstructionsPanelProps {
  hostId: string;
  hostName: string;
  lastLog: HealthCheckLog | undefined;
}

/**
 * Shown for a host still in pending_setup - both right after creation and
 * on any later revisit. Always fetches fresh via GET
 * /hosts/:id/setup-instructions rather than trusting client-side state, so
 * a page reload shows the same thing.
 */
export function SetupInstructionsPanel({ hostId, hostName, lastLog }: SetupInstructionsPanelProps) {
  const instructions = useSetupInstructions(hostId);
  const triggerCheck = useTriggerHostCheck(hostId);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
          Finish setting up {hostName}
        </h2>
        <p className="text-sm text-text-muted">
          Paste this into a terminal on your server, once, to let it accept connections from
          Servers-Manager.
        </p>
      </div>

      <AsyncBoundary
        isLoading={instructions.isLoading}
        isError={instructions.isError}
        data={instructions.data}
      >
        {(data) => (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Public key
              </span>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-bg-base p-3.5 font-mono text-xs text-text-secondary">
                {data.ssh_public_key}
              </pre>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Bootstrap command
              </span>
              <div className="flex items-start gap-2">
                <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-bg-base p-3.5 font-mono text-xs text-text-secondary">
                  {data.bootstrap_command}
                </pre>
                <CopyButton value={data.bootstrap_command} label="Copy command" />
              </div>
            </div>
          </div>
        )}
      </AsyncBoundary>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <CheckNowButton
          onCheck={() => triggerCheck.mutate()}
          isPending={triggerCheck.isPending}
          label="Verify connection"
          pendingLabel="Verifying…"
        />
        {isKeyNotInstalledYet(lastLog) && (
          <span className="rounded-lg bg-status-warning/10 px-3 py-1.5 text-sm text-status-warning">
            Key not installed yet - paste the bootstrap command above, then try again.
          </span>
        )}
      </div>
    </Card>
  );
}
