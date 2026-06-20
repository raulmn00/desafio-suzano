import { ConflictError, NotFoundError } from '../../../shared/domain/domain-error';

export class ItemNaoEncontradoError extends NotFoundError {
  constructor(idOuSku: string) {
    super(`Item não encontrado: ${idOuSku}.`);
  }
}

export class SkuJaCadastradoError extends ConflictError {
  constructor(sku: string) {
    super(`Já existe um item com o SKU "${sku}". Use um SKU diferente.`);
  }
}
