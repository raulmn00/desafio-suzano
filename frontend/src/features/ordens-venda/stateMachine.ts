import type { StatusOv } from './schema';

/** Transições sequenciais válidas da OV. */
const NEXT: Record<StatusOv, StatusOv | null> = {
  CRIADA: 'PLANEJADA',
  PLANEJADA: 'AGENDADA',
  AGENDADA: 'EM_TRANSPORTE',
  EM_TRANSPORTE: 'ENTREGUE',
  ENTREGUE: null,
};

export function proximoStatus(status: StatusOv): StatusOv | null {
  return NEXT[status];
}

export const STATUS_LABEL: Record<StatusOv, string> = {
  CRIADA: 'Criada',
  PLANEJADA: 'Planejada',
  AGENDADA: 'Agendada',
  EM_TRANSPORTE: 'Em transporte',
  ENTREGUE: 'Entregue',
};

/**
 * Para avançar de PLANEJADA -> AGENDADA é necessário agendamento confirmado.
 * Retorna o motivo de bloqueio, ou null se a transição estiver liberada.
 */
export function bloqueioTransicao(
  status: StatusOv,
  agendamentoConfirmado: boolean,
): string | null {
  const proximo = proximoStatus(status);
  if (!proximo) return 'Ordem já entregue — sem próximas transições.';
  if (proximo === 'AGENDADA' && !agendamentoConfirmado) {
    return 'É necessário um agendamento confirmado para avançar para AGENDADA.';
  }
  return null;
}
