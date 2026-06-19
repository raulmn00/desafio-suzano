import { ConflictError, NotFoundError } from '../../../shared/domain/domain-error';

export class ClienteNaoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Cliente não encontrado: ${id}.`);
  }
}

export class DocumentoJaCadastradoError extends ConflictError {
  constructor(documento: string) {
    super(`Já existe um cliente com o documento "${documento}".`);
  }
}
