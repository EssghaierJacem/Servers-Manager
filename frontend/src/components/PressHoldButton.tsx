import { useEffect, useRef, useState } from 'react';

export const HOLD_DURATION_MS = 1500;

interface PressHoldButtonProps {
  label: string;
  holdingLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

/**
 * The app's one moment of ceremony: destructive actions (rollback) require
 * a sustained press rather than a click-through confirm dialog. Works from
 * both pointer and keyboard (Enter/Space) so the destructive action never
 * has a mouse-only path. The fill itself is a pure CSS transition timed to
 * HOLD_DURATION_MS; a single timeout is the only thing that actually fires
 * onConfirm, so the visual and the real trigger can never drift apart.
 */
export function PressHoldButton({
  label,
  holdingLabel,
  onConfirm,
  disabled,
}: PressHoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const start = (): void => {
    if (disabled || timeoutRef.current !== null) return;
    setIsHolding(true);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setIsHolding(false);
      onConfirm();
    }, HOLD_DURATION_MS);
  };

  const cancel = (): void => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHolding(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          cancel();
        }
      }}
      onBlur={cancel}
      className="relative isolate select-none overflow-hidden rounded border border-status-critical px-5 py-2.5 font-mono text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 origin-left bg-status-critical/25"
        style={{
          transform: isHolding ? 'scaleX(1)' : 'scaleX(0)',
          transitionProperty: 'transform',
          transitionDuration: isHolding ? `${HOLD_DURATION_MS}ms` : '150ms',
          transitionTimingFunction: isHolding ? 'linear' : 'ease-out',
        }}
      />
      {isHolding ? (holdingLabel ?? label) : label}
    </button>
  );
}
