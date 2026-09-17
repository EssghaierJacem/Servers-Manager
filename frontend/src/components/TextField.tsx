import { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  mono?: boolean;
}

/** The one text-input shape used by every form in the app (login, signup, add host). */
export function TextField({ label, mono, className, ...inputProps }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <input
        {...inputProps}
        className={`rounded-lg border border-border bg-bg-base px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors duration-150 placeholder:text-text-muted hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 ${
          mono ? 'font-mono' : ''
        } ${className ?? ''}`}
      />
    </label>
  );
}
