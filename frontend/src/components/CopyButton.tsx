import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { CopyCheckIcon, CopyIcon } from './icons';

const CONFIRMATION_DURATION_MS = 2000;

interface CopyButtonProps {
  value: string;
  label?: string;
}

/** A copy-to-clipboard control that visibly confirms the copy happened, both inline and as a toast. */
export function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), CONFIRMATION_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleClick = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ease-smooth active:scale-95 ${
        copied
          ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy'
          : 'border-border bg-bg-panel text-text-primary hover:border-border-strong hover:bg-bg-elevated'
      }`}
    >
      {copied ? <CopyCheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
