import type { StatusColorKey } from '../lib/statusColor';

export interface StatusBreakdownSegment {
  key: string;
  label: string;
  value: number;
  colorKey: StatusColorKey;
}

const SEGMENT_BG_CLASS: Record<StatusColorKey, string> = {
  healthy: 'bg-status-healthy',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
  unknown: 'bg-status-unknown',
};

const LEGEND_DOT_CLASS = SEGMENT_BG_CLASS;

interface StatusBreakdownBarProps {
  title: string;
  segments: StatusBreakdownSegment[];
}

/**
 * A single-measure status breakdown: a segmented bar (status color, 2px gaps,
 * rounded ends) plus a always-present legend with the real counts - color is
 * never the only carrier of meaning here.
 */
export function StatusBreakdownBar({ title, segments }: StatusBreakdownBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visibleSegments = segments.filter((s) => s.value > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <span className="font-mono text-sm text-text-primary">{total}</span>
      </div>

      {total === 0 ? (
        <div className="h-2 rounded-full bg-bg-elevated" />
      ) : (
        <div className="flex h-2 gap-0.5">
          {visibleSegments.map((segment) => (
            <div
              key={segment.key}
              title={`${segment.label}: ${segment.value}`}
              className={`h-full rounded-full transition-[width] duration-300 ${SEGMENT_BG_CLASS[segment.colorKey]}`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5 text-sm">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 rounded-full ${LEGEND_DOT_CLASS[segment.colorKey]}`}
            />
            <span className="text-text-muted">{segment.label}</span>
            <span className="font-mono text-text-primary">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
