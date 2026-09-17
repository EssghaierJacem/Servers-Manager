import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** The one card container shape used across the dashboard. */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-bg-panel shadow-lg shadow-black/20 ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
