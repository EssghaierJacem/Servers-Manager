interface SkeletonProps {
  className?: string;
}

/** A single pulsing placeholder block - the building block of every loading state. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={`skeleton rounded-md ${className ?? 'h-4 w-full'}`} />;
}

/** A stack of table-row-shaped skeleton lines, sized to roughly match BoardTable. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 border-b border-border px-5 py-4 last:border-b-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
        </div>
      ))}
    </div>
  );
}
