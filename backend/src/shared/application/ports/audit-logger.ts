/**
 * Vocabulário de ações auditáveis. Verbos de negócio (não verbos técnicos),
 * para que a trilha responda "o quê aconteceu" em termos do domínio.
 */
export enum AcaoAuditoria {
  ORDEM_VENDA_CRIADA = 'ORDEM_VENDA_CRIADA',
  ORDEM_VENDA_STATUS_ALTERADO = 'ORDEM_VENDA_STATUS_ALTERADO',
  ORDEM_VENDA_AGENDAMENTO_DEFINIDO = 'ORDEM_VENDA_AGENDAMENTO_DEFINIDO',
  ORDEM_VENDA_AGENDAMENTO_CONFIRMADO = 'ORDEM_VENDA_AGENDAMENTO_CONFIRMADO',
  ORDEM_VENDA_REAGENDADA = 'ORDEM_VENDA_REAGENDADA',
  ORDEM_VENDA_TRANSPORTE_ALTERADO = 'ORDEM_VENDA_TRANSPORTE_ALTERADO',
}

/** Tipos de entidade auditável (alvo do evento). */
export enum EntidadeAuditavel {
  ORDEM_VENDA = 'ORDEM_VENDA',
}

export interface RegistroAuditoria {
  ator: string;
  acao: AcaoAuditoria;
  entidadeTipo: EntidadeAuditavel | string;
  entidadeId: string;
  estadoAnterior?: Record<string, unknown> | null;
  estadoPosterior?: Record<string, unknown> | null;
  correlationId?: string | null;
}

/**
 * Port de auditoria. A implementação grava o evento append-only NA MESMA
 * transação da mudança de estado (estilo outbox), garantindo que não exista
 * mudança de domínio sem evento correspondente.
 */
export abstract class AuditLogger {
  abstract registrar(registro: RegistroAuditoria): Promise<void>;
}
