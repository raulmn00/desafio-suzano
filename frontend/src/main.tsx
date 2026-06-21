import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { App } from './App';
import { ErroFatal } from './components/ErroFatal';
import './styles.css';

// Sentry gated por DSN: sem VITE_SENTRY_DSN, não inicializa (no-op). O
// ErrorBoundary funciona mesmo assim (captura o erro e mostra o fallback);
// só não reporta ao Sentry sem o DSN.
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  });
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemento #root não encontrado.');
}

createRoot(rootEl).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErroFatal />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
