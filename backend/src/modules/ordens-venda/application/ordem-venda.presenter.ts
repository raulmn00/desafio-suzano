import { OrdemDeVenda } from '../domain/ordem-venda.entity';

export interface AgendamentoView {
  dataEntrega: string;
  janelaInicio: string;
  janelaFim: string;
  confirmado: boolean;
}

export interface OrdemVendaView {
  id: string;
  clienteId: string;
  tipoTransporteId: string;
  status: string;
  itens: Array<{ itemId: string; quantidade: number }>;
  agendamento: AgendamentoView | null;
  criadoEm: string;
  atualizadoEm: string;
}

export function apresentarOrdem(ordem: OrdemDeVenda): OrdemVendaView {
  const agendamento = ordem.agendamento;
  return {
    id: ordem.id,
    clienteId: ordem.clienteId,
    tipoTransporteId: ordem.tipoTransporteId,
    status: ordem.status,
    itens: ordem.itens,
    agendamento: agendamento
      ? {
          dataEntrega: agendamento.dataEntrega.toISOString(),
          janelaInicio: agendamento.janelaInicio,
          janelaFim: agendamento.janelaFim,
          confirmado: agendamento.confirmado,
        }
      : null,
    criadoEm: ordem.criadoEm.toISOString(),
    atualizadoEm: ordem.atualizadoEm.toISOString(),
  };
}

/** Snapshot enxuto do estado relevante, usado na trilha de auditoria. */
export function snapshotOrdem(ordem: OrdemDeVenda): Record<string, unknown> {
  const agendamento = ordem.agendamento;
  return {
    status: ordem.status,
    tipoTransporteId: ordem.tipoTransporteId,
    agendamento: agendamento
      ? {
          dataEntrega: agendamento.dataEntrega.toISOString(),
          janelaInicio: agendamento.janelaInicio,
          janelaFim: agendamento.janelaFim,
          confirmado: agendamento.confirmado,
        }
      : null,
  };
}
