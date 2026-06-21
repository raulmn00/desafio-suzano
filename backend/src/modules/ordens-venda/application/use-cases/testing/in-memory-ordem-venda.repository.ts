import { Paginacao, paginaSkip, ResultadoPaginado } from '../../../../../shared/domain/pagination';
import { OrdemDeVenda } from '../../../domain/ordem-venda.entity';
import { FiltrosOrdemVenda, OrdemVendaRepository } from '../../../domain/ordem-venda.repository';

export class InMemoryOrdemVendaRepository extends OrdemVendaRepository {
  readonly itens = new Map<string, OrdemDeVenda>();

  async salvar(ordem: OrdemDeVenda): Promise<void> {
    this.itens.set(ordem.id, ordem);
  }

  async buscarPorId(id: string): Promise<OrdemDeVenda | null> {
    return this.itens.get(id) ?? null;
  }

  async listar(
    filtros: FiltrosOrdemVenda,
    paginacao: Paginacao,
  ): Promise<ResultadoPaginado<OrdemDeVenda>> {
    const filtrados = [...this.itens.values()].filter(
      (o) =>
        (filtros.status === undefined || o.status === filtros.status) &&
        (filtros.clienteId === undefined || o.clienteId === filtros.clienteId) &&
        (filtros.tipoTransporteId === undefined ||
          o.tipoTransporteId === filtros.tipoTransporteId) &&
        (filtros.criadoDe === undefined || o.criadoEm >= filtros.criadoDe) &&
        (filtros.criadoAte === undefined || o.criadoEm <= filtros.criadoAte),
    );
    const inicio = paginaSkip(paginacao);
    return { itens: filtrados.slice(inicio, inicio + paginacao.limit), total: filtrados.length };
  }

  async existePorId(id: string): Promise<boolean> {
    return this.itens.has(id);
  }
}
