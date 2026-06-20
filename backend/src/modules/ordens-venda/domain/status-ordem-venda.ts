import { BusinessRuleError } from '../../../shared/domain/domain-error';

/** Estados do ciclo de vida operacional de uma Ordem de Venda. */
export enum StatusOrdemVenda {
  CRIADA = 'CRIADA',
  PLANEJADA = 'PLANEJADA',
  AGENDADA = 'AGENDADA',
  EM_TRANSPORTE = 'EM_TRANSPORTE',
  ENTREGUE = 'ENTREGUE',
}

/**
 * Máquina de estados: o fluxo é estritamente sequencial e unidirecional
 * (CRIADA → PLANEJADA → AGENDADA → EM_TRANSPORTE → ENTREGUE). Qualquer outra
 * transição é rejeitada. A tabela é a única fonte de verdade das transições.
 */
export const TRANSICOES_VALIDAS: Readonly<Record<StatusOrdemVenda, readonly StatusOrdemVenda[]>> = {
  [StatusOrdemVenda.CRIADA]: [StatusOrdemVenda.PLANEJADA],
  [StatusOrdemVenda.PLANEJADA]: [StatusOrdemVenda.AGENDADA],
  [StatusOrdemVenda.AGENDADA]: [StatusOrdemVenda.EM_TRANSPORTE],
  [StatusOrdemVenda.EM_TRANSPORTE]: [StatusOrdemVenda.ENTREGUE],
  [StatusOrdemVenda.ENTREGUE]: [],
};

export function podeTransicionar(de: StatusOrdemVenda, para: StatusOrdemVenda): boolean {
  return TRANSICOES_VALIDAS[de].includes(para);
}

export class TransicaoInvalidaError extends BusinessRuleError {
  constructor(de: StatusOrdemVenda, para: StatusOrdemVenda) {
    const proximos = TRANSICOES_VALIDAS[de];
    const dica =
      proximos.length === 0
        ? `A ordem está no status final ${de} e não permite novas transições.`
        : `A partir de ${de}, o próximo status válido é ${proximos.join(' ou ')}.`;
    super(`Transição de status inválida: ${de} → ${para}. ${dica}`);
  }
}
