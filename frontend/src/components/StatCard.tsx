import { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: 'default' | 'healthy' | 'warning' | 'critical';
}

const TONE_ICON_CLASS: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-accent/10 text-accent',
  healthy: 'bg-status-healthy/15 text-status-healthy',
  warning: 'bg-status-warning/15 text-status-warning',
  critical: 'bg-status-critical/15 text-status-critical',
};

/** A single number/label stat tile, the building block of the dashboard grid. */
export function StatCard({ label, value, icon, tone = 'default' }: StatCardProps) {
  return (
    <Card className="flex items-center justify-between gap-4 p-5 transition-shadow duration-150 hover:shadow-popover">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <span className="text-3xl font-semibold tracking-tight text-text-primary">{value}</span>
      </div>
      {icon && (
        <div className={`rounded-lg p-2.5 ${TONE_ICON_CLASS[tone]}`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
      )}
    </Card>
  );
}
