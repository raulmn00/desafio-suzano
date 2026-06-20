import {
  BusinessRuleError,
  DomainValidationError,
  NotFoundError,
} from '../../../shared/domain/domain-error';

export class OrdemVendaNaoEncontradaError extends NotFoundError {
  constructor(id: string) {
    super(`Ordem de venda não encontrada: ${id}.`);
  }
}

export class OrdemSemItensError extends DomainValidationError {
  constructor() {
    super('A ordem de venda deve conter ao menos um item.');
  }
}

export class ItemDuplicadoNaOrdemError extends DomainValidationError {
  constructor(itemId: string) {
    super(`Item duplicado na ordem de venda: ${itemId}.`);
  }
}

export class QuantidadeInvalidaError extends DomainValidationError {
  constructor(itemId: string) {
    super(`Quantidade do item ${itemId} deve ser maior que zero.`);
  }
}

export class TransporteNaoAutorizadoError extends BusinessRuleError {
  constructor(tipoTransporteId: string) {
    super(`O tipo de transporte "${tipoTransporteId}" não está autorizado para este cliente.`);
  }
}

export class AgendamentoInvalidoError extends DomainValidationError {}

export class AgendamentoInexistenteError extends BusinessRuleError {
  constructor() {
    super('A ordem de venda não possui agendamento.');
  }
}

export class AgendamentoNaoConfirmadoError extends BusinessRuleError {
  constructor() {
    super('A ordem de venda só pode ser agendada após a confirmação do agendamento.');
  }
}

export class OperacaoInvalidaParaStatusError extends BusinessRuleError {
  constructor(operacao: string, status: string) {
    super(`Operação "${operacao}" não permitida com a ordem no status ${status}.`);
  }
}
