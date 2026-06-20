import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <span className="error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
