/**
 * Erro de domínio. Erros de negócio são lançados como exceções tipadas e
 * traduzidos para HTTP por um único filtro na borda (infraestrutura), mantendo
 * o domínio livre de qualquer dependência de transporte/HTTP.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Recurso não encontrado → HTTP 404. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

/** Conflito de unicidade/estado (ex.: documento já cadastrado) → HTTP 409. */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}

/** Falha de autenticação (ex.: credenciais inválidas) → HTTP 401. */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
}

/** Violação de regra de negócio/invariante (ex.: transição inválida) → HTTP 422. */
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE';
}

/** Dado inválido de domínio (ex.: documento mal formado) → HTTP 422. */
export class DomainValidationError extends DomainError {
  readonly code = 'DOMAIN_VALIDATION';
}
