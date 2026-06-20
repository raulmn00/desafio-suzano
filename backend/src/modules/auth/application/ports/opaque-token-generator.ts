/**
 * Port de geração de tokens opacos (aleatórios, não-JWT) — usados como refresh
 * tokens. Implementado por `CryptoOpaqueTokenGenerator`.
 */
export abstract class OpaqueTokenGenerator {
  abstract gerar(): string;
}
