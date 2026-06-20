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
    super('A ordem de venda deve conter ao menos um item. Adicione um ou mais itens à ordem.');
  }
}

export class ItemDuplicadoNaOrdemError extends DomainValidationError {
  constructor(itemId: string) {
    super(
      `O item "${itemId}" aparece mais de uma vez na ordem. ` +
        'Cada item deve constar em uma única linha — some as quantidades.',
    );
  }
}

export class QuantidadeInvalidaError extends DomainValidationError {
  constructor(itemId: string) {
    super(`A quantidade do item "${itemId}" deve ser um número inteiro maior que zero.`);
  }
}

export class TransporteNaoAutorizadoError extends BusinessRuleError {
  constructor(tipoTransporteId: string) {
    super(
      `O tipo de transporte "${tipoTransporteId}" não está autorizado para este cliente. ` +
        'Autorize-o para o cliente (em Clientes → transportes autorizados) antes de usá-lo na ordem.',
    );
  }
}

export class AgendamentoInvalidoError extends DomainValidationError {}

export class AgendamentoInexistenteError extends BusinessRuleError {
  constructor() {
    super(
      'A ordem de venda ainda não possui agendamento. ' +
        'Defina um agendamento (data de entrega e janela de atendimento) antes de confirmá-lo ou reagendá-lo.',
    );
  }
}

export class AgendamentoNaoConfirmadoError extends BusinessRuleError {
  constructor() {
    super(
      'A ordem só pode avançar para AGENDADA após a confirmação do agendamento. ' +
        'Defina o agendamento e clique em "Confirmar agendamento" antes de mudar o status.',
    );
  }
}

export class OperacaoInvalidaParaStatusError extends BusinessRuleError {
  constructor(operacao: string, status: string, permitidos: string[], dica: string) {
    super(
      `Operação "${operacao}" não permitida com a ordem no status ${status}. ` +
        `Só é permitida quando o status for ${permitidos.join(' ou ')}. ${dica}`,
    );
  }
}
