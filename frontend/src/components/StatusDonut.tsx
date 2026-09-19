import type { StatusColorKey } from '../lib/statusColor';

export interface StatusDonutSegment {
  key: string;
  label: string;
  value: number;
  colorKey: StatusColorKey;
}

const SEGMENT_STROKE_CLASS: Record<StatusColorKey, string> = {
  healthy: 'stroke-status-healthy',
  warning: 'stroke-status-warning',
  critical: 'stroke-status-critical',
  unknown: 'stroke-status-unknown',
};

const LEGEND_DOT_CLASS: Record<StatusColorKey, string> = {
  healthy: 'bg-status-healthy',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
  unknown: 'bg-status-unknown',
};

const SIZE = 112;
const RADIUS = 44;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_PX = 3;

interface StatusDonutProps {
  title: string;
  segments: StatusDonutSegment[];
}

/**
 * A part-to-whole status distribution: a single-measure donut (reserved
 * status colors, a rounded-end 3px gap between arcs) with the total centered
 * and an always-present, direct-labeled legend - color never carries meaning
 * alone.
 */
export function StatusDonut({ title, segments }: StatusDonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visibleSegments = segments.filter((s) => s.value > 0);

  let cumulative = 0;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-text-secondary">{title}</h3>

      <div className="flex items-center gap-5">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          className="-rotate-90 shrink-0"
          role="img"
          aria-label={`${title}: ${total} total`}
        >
          {total === 0 ? (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              className="stroke-bg-elevated"
            />
          ) : (
            visibleSegments.map((segment) => {
              const length = (segment.value / total) * CIRCUMFERENCE - GAP_PX;
              const dashArray = `${Math.max(length, 0)} ${CIRCUMFERENCE}`;
              const dashOffset = -cumulative;
              cumulative += (segment.value / total) * CIRCUMFERENCE;
              return (
                <circle
                  key={segment.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className={`${SEGMENT_STROKE_CLASS[segment.colorKey]} transition-[stroke-dasharray] duration-300`}
                />
              );
            })
          )}
          <text
            x={SIZE / 2}
            y={SIZE / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="rotate-90 fill-text-primary font-mono text-2xl font-semibold"
            style={{ transformOrigin: `${SIZE / 2}px ${SIZE / 2}px` }}
          >
            {total}
          </text>
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-1.5 text-sm">
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${LEGEND_DOT_CLASS[segment.colorKey]}`}
              />
              <span className="truncate text-text-muted">{segment.label}</span>
              <span className="ml-auto font-mono text-text-primary">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
