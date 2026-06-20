/**
 * Validação de variáveis de ambiente no boot (usada pelo ConfigModule).
 * O foco é o `JWT_SECRET`: ele é obrigatório em qualquer ambiente e, em
 * produção, precisa ser forte e único — nunca um dos valores padrão/conhecidos
 * versionados no repositório. Falha rápido (o app não sobe) em vez de degradar
 * silenciosamente para um segredo inseguro.
 */

const TAMANHO_MINIMO_SEGREDO = 32;

/** Segredos que aparecem no repositório (fallbacks, exemplos, CI, compose). */
const SEGREDOS_CONHECIDOS = new Set([
  'dev-secret',
  'dev-secret-troque-em-producao',
  'troque-este-segredo-em-producao',
  'ci-secret',
  'dev-insecure-local-secret-change-me-0123456789',
]);

export function validateEnv<T extends Record<string, unknown>>(config: T): T {
  const nodeEnv = (config.NODE_ENV as string | undefined) ?? 'development';
  const ehProducao = nodeEnv === 'production';
  const segredo = config.JWT_SECRET;

  if (typeof segredo !== 'string' || segredo.length === 0) {
    throw new Error('Configuração inválida: JWT_SECRET é obrigatório (defina-o no ambiente).');
  }

  if (ehProducao) {
    if (SEGREDOS_CONHECIDOS.has(segredo)) {
      throw new Error(
        'Configuração inválida: em produção, JWT_SECRET não pode ser um valor padrão/conhecido ' +
          'do repositório. Gere um segredo forte e único (ex.: `openssl rand -base64 48`).',
      );
    }
    if (segredo.length < TAMANHO_MINIMO_SEGREDO) {
      throw new Error(
        `Configuração inválida: em produção, JWT_SECRET deve ter ao menos ${TAMANHO_MINIMO_SEGREDO} caracteres.`,
      );
    }
  }

  return config;
}
