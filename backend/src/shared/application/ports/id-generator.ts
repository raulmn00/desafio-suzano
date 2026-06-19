/**
 * Port de geração de identificadores. Mantém os use-cases independentes da
 * estratégia concreta de ID (UUID v4 via `UuidGenerator`).
 */
export abstract class IdGenerator {
  abstract gerar(): string;
}
