import { getStatusColorKey } from '../lib/statusColor';

const DOT_COLOR_CLASS: Record<ReturnType<typeof getStatusColorKey>, string> = {
  healthy: 'bg-status-healthy',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
  unknown: 'bg-status-unknown',
};

interface StatusDotProps {
  status: string;
  /** Overrides the visible label text; the status word is shown by default. */
  label?: string;
}

/**
 * The one place status is ever displayed: a filled dot in the status color
 * plus the status word in muted text - never a tinted pill/badge.
 */
export function StatusDot({ status, label }: StatusDotProps) {
  const colorKey = getStatusColorKey(status);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`inline-block h-[7px] w-[7px] rounded-full ${DOT_COLOR_CLASS[colorKey]}`}
      />
      <span className="text-text-muted">{label ?? status}</span>
    </span>
  );
}
