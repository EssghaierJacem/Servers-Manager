import { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  mono?: boolean;
}

/** The shared field-chrome classes, exported so <select> fields can match <input> ones exactly. */
export const FIELD_CLASS =
  'rounded-lg border border-border bg-bg-base px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors duration-150 hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function SelectField({ label, className, children, ...selectProps }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <select {...selectProps} className={`${FIELD_CLASS} ${className ?? ''}`}>
        {children}
      </select>
    </label>
  );
}

/** The one text-input shape used by every form in the app (login, signup, add host). */
export function TextField({ label, mono, className, ...inputProps }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <input
        {...inputProps}
        className={`${FIELD_CLASS} placeholder:text-text-muted ${mono ? 'font-mono' : ''} ${
          className ?? ''
        }`}
      />
    </label>
  );
}
