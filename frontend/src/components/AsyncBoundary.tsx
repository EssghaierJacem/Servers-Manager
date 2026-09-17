import { ReactNode } from 'react';

interface AsyncBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T | undefined;
  children: (data: T) => ReactNode;
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
}: AsyncBoundaryProps<T>) {
  if (isLoading) {
    return <p className="font-mono text-sm text-text-muted">Loading...</p>;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    return <p className="font-mono text-sm text-status-critical">{message}</p>;
  }

  if (data === undefined) {
    return null;
  }

  return <>{children(data)}</>;
}
