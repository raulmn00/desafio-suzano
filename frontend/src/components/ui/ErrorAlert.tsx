import { extractApiErrorMessage } from '../../lib/http';

interface ErrorAlertProps {
  error: unknown;
  /** mensagem explícita (sobrepõe extração do erro) */
  message?: string;
}

export function ErrorAlert({ error, message }: ErrorAlertProps) {
  const text = message ?? extractApiErrorMessage(error);
  return (
    <div className="alert error" role="alert">
      {text}
    </div>
  );
}
