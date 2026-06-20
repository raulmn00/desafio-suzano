import {
  Agendamento as AgendamentoPrisma,
  ItemOrdemVenda as ItemOrdemVendaPrisma,
  OrdemVenda as OrdemVendaPrisma,
} from '@prisma/client';
import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';

export type OrdemComRelacoes = OrdemVendaPrisma & {
  itens: ItemOrdemVendaPrisma[];
  agendamento: AgendamentoPrisma | null;
};

export class OrdemVendaMapper {
  static toDomain(raw: OrdemComRelacoes): OrdemDeVenda {
    return OrdemDeVenda.restaurar({
      id: raw.id,
      clienteId: raw.clienteId,
      tipoTransporteId: raw.tipoTransporteId,
      status: raw.status as StatusOrdemVenda,
      itens: raw.itens.map((i) => ({ itemId: i.itemId, quantidade: i.quantidade })),
      agendamento: raw.agendamento
        ? {
            dataEntrega: raw.agendamento.dataEntrega,
            janelaInicio: raw.agendamento.janelaInicio,
            janelaFim: raw.agendamento.janelaFim,
            confirmado: raw.agendamento.confirmado,
          }
        : null,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }
}
