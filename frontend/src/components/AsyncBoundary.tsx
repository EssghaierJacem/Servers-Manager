import { ReactNode } from 'react';
import { SkeletonRows } from './Skeleton';

interface AsyncBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T | undefined;
  children: (data: T) => ReactNode;
  /** Overrides the default skeleton shape shown while loading. */
  loadingFallback?: ReactNode;
}

/**
 * The single loading/error/data-present pattern every list and detail
 * screen uses, so that pattern is written once instead of per-page.
 */
export function AsyncBoundary<T>({
  isLoading,
  isError,
  error,
  data,
  children,
  loadingFallback,
}: AsyncBoundaryProps<T>) {
  if (isLoading) {
    return <>{loadingFallback ?? <SkeletonRows />}</>;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    return (
      <div className="flex items-center gap-3 px-5 py-6 text-sm text-status-critical">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="h-5 w-5 shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" strokeLinecap="round" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }

  if (data === undefined) {
    return null;
  }

  return <div className="animate-fade-in">{children(data)}</div>;
}
