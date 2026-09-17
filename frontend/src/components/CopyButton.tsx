import { useEffect, useState } from 'react';

const CONFIRMATION_DURATION_MS = 2000;

interface CopyButtonProps {
  value: string;
  label?: string;
}

/** A copy-to-clipboard control that visibly confirms the copy happened. */
export function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), CONFIRMATION_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleClick = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
        copied
          ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy'
          : 'border-border bg-bg-panel text-text-primary hover:border-border-strong hover:bg-bg-elevated'
      }`}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
