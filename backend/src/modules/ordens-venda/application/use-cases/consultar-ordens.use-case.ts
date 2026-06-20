import {
  FiltrosOrdemVenda,
  OrdemVendaRepository,
} from '../../domain/ordem-venda.repository';
import { apresentarOrdem, OrdemVendaView } from '../ordem-venda.presenter';

export class ConsultarOrdensUseCase {
  constructor(private readonly repositorio: OrdemVendaRepository) {}

  async executar(filtros: FiltrosOrdemVenda): Promise<OrdemVendaView[]> {
    const ordens = await this.repositorio.listar(filtros);
    return ordens.map(apresentarOrdem);
  }
}
