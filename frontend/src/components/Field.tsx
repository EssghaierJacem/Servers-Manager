import { ReactNode } from 'react';

/** One label/value pair in a detail page's summary grid. */
export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="text-[15px] text-text-primary">{value}</dd>
    </div>
  );
}
