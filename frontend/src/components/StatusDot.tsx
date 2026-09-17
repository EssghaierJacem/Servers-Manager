import { formatStatusLabel, getStatusColorKey } from '../lib/statusColor';

const BADGE_CLASS: Record<ReturnType<typeof getStatusColorKey>, string> = {
  healthy: 'bg-status-healthy/15 text-status-healthy',
  warning: 'bg-status-warning/15 text-status-warning',
  critical: 'bg-status-critical/15 text-status-critical',
  unknown: 'bg-status-unknown/15 text-status-unknown',
};

interface StatusDotProps {
  status: string;
  /** Overrides the visible label text; the humanized status word is shown by default. */
  label?: string;
}

/** The one place status is ever displayed: a colored pill badge. */
export function StatusDot({ status, label }: StatusDotProps) {
  const colorKey = getStatusColorKey(status);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_CLASS[colorKey]}`}
    >
      {label ?? formatStatusLabel(status)}
    </span>
  );
}
