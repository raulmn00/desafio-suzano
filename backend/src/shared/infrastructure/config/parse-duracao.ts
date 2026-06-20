const UNIDADES_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Converte uma duração no formato `<n>[s|m|h|d]` (ex.: '15m', '7d') em
 * milissegundos. Um número puro é interpretado como segundos. Lança em formato
 * inválido. Usado para o TTL de refresh token.
 */
export function parseDuracaoMs(valor: string): number {
  const match = /^(\d+)([smhd]?)$/.exec(valor.trim());
  if (!match) {
    throw new Error(`Duração inválida: "${valor}". Use formato como 15m, 2h, 7d ou 30s.`);
  }
  const quantidade = Number(match[1]);
  const unidade = match[2] || 's';
  return quantidade * UNIDADES_MS[unidade];
}
