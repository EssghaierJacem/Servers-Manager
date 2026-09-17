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
      className="rounded border border-border px-3 py-1.5 text-sm text-text-primary hover:border-accent"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
