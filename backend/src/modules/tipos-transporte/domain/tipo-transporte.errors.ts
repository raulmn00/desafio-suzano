import { ConflictError, NotFoundError } from '../../../shared/domain/domain-error';

export class TipoTransporteNaoEncontradoError extends NotFoundError {
  constructor(idOuCodigo: string) {
    super(`Tipo de transporte não encontrado: ${idOuCodigo}.`);
  }
}

export class CodigoTransporteJaCadastradoError extends ConflictError {
  constructor(codigo: string) {
    super(`Já existe um tipo de transporte com o código "${codigo}". Use um código diferente.`);
  }
}
