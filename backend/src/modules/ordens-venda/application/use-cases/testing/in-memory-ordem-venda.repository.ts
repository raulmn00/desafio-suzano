import { OrdemDeVenda } from '../../../domain/ordem-venda.entity';
import {
  FiltrosOrdemVenda,
  OrdemVendaRepository,
} from '../../../domain/ordem-venda.repository';

export class InMemoryOrdemVendaRepository extends OrdemVendaRepository {
  readonly itens = new Map<string, OrdemDeVenda>();

  async salvar(ordem: OrdemDeVenda): Promise<void> {
    this.itens.set(ordem.id, ordem);
  }

  async buscarPorId(id: string): Promise<OrdemDeVenda | null> {
    return this.itens.get(id) ?? null;
  }

  async listar(filtros: FiltrosOrdemVenda): Promise<OrdemDeVenda[]> {
    return [...this.itens.values()].filter(
      (o) =>
        (filtros.status === undefined || o.status === filtros.status) &&
        (filtros.clienteId === undefined || o.clienteId === filtros.clienteId) &&
        (filtros.tipoTransporteId === undefined || o.tipoTransporteId === filtros.tipoTransporteId) &&
        (filtros.criadoDe === undefined || o.criadoEm >= filtros.criadoDe) &&
        (filtros.criadoAte === undefined || o.criadoEm <= filtros.criadoAte),
    );
  }

  async existePorId(id: string): Promise<boolean> {
    return this.itens.has(id);
  }
}
