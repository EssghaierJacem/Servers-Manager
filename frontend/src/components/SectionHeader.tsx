import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: ReactNode;
}

/** "Hosts (12)" style header - the aggregate count lives inline, not in a separate stat tile. */
export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <h2 className="text-lg text-text-primary">
        {title}
        {count !== undefined && <span className="text-text-muted"> ({count})</span>}
      </h2>
      {action}
    </div>
  );
}
