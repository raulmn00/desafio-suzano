import * as Sentry from '@sentry/nestjs';

/**
 * Inicialização do Sentry (instrumentação). DEVE ser importado ANTES de qualquer
 * outra coisa nos entrypoints (`main.ts`, `function.ts`) para que a auto-
 * instrumentação carregue antes das libs instrumentadas.
 *
 * Gated por `SENTRY_DSN`: sem o DSN o init é no-op (Sentry desativado) — então é
 * seguro em dev/CI/test e o deploy sobe inerte até o DSN ser configurado.
 */
Sentry.init({
  enabled: !!process.env.SENTRY_DSN,
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  // Amostragem de tracing (0 = só erros). Ajustável por ambiente.
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
});
