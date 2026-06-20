interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Carregando...' }: SpinnerProps) {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
