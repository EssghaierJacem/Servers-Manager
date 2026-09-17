interface LogoProps {
  className?: string;
}

/**
 * Brand mark: three patch-panel bars with a status LED on each, echoing the
 * departure-board/patch-panel concept instead of a generic gradient glyph.
 */
export function LogoMark({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Servers-Manager"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="3"
        width="20"
        height="4.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="2"
        y="9.75"
        width="20"
        height="4.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="2"
        y="16.5"
        width="20"
        height="4.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="5.5" cy="5.25" r="1.15" fill="rgb(var(--accent))" />
      <circle cx="5.5" cy="12" r="1.15" fill="rgb(var(--accent))" />
      <circle cx="5.5" cy="18.75" r="1.15" fill="rgb(var(--accent))" />
    </svg>
  );
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-text-primary ${className ?? ''}`}>
      <LogoMark className="h-6 w-6 text-accent" />
      <span className="text-[15px] font-semibold tracking-tight">Servers-Manager</span>
    </span>
  );
}
