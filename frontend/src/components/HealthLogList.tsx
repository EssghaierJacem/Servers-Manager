import { StatusDot } from './StatusDot';
import { formatTimestamp } from '../lib/formatters';
import type { HealthCheckLog } from '../lib/types';

/** Shared rendering for a HealthCheckLog[] history - used by host/domain detail pages. */
export function HealthLogList({ logs }: { logs: HealthCheckLog[] }) {
  if (logs.length === 0) {
    return <p className="px-5 py-6 text-sm text-text-muted">No check history yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex items-start gap-4 border-b border-border px-5 py-3 last:border-b-0"
        >
          <span className="w-40 shrink-0 font-mono text-xs text-text-muted">
            {formatTimestamp(log.checked_at)}
          </span>
          <StatusDot status={log.status} />
          <span className="truncate font-mono text-xs text-text-muted">
            {JSON.stringify(log.raw_output)}
          </span>
        </li>
      ))}
    </ul>
  );
}
