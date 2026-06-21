import {
  montarPagina,
  Pagina,
  Paginacao,
  resolverPaginacao,
} from '../../../../shared/domain/pagination';
import { FiltrosOrdemVenda, OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { apresentarOrdem, OrdemVendaView } from '../ordem-venda.presenter';

export class ConsultarOrdensUseCase {
  constructor(private readonly repositorio: OrdemVendaRepository) {}

  async executar(
    filtros: FiltrosOrdemVenda,
    paginacao: Paginacao = resolverPaginacao(),
  ): Promise<Pagina<OrdemVendaView>> {
    const { itens, total } = await this.repositorio.listar(filtros, paginacao);
    return montarPagina(itens.map(apresentarOrdem), total, paginacao);
  }
}
