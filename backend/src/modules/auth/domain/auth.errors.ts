import { UnauthorizedError } from '../../../shared/domain/domain-error';

export class CredenciaisInvalidasError extends UnauthorizedError {
  constructor() {
    super('Credenciais inválidas.');
  }
}
