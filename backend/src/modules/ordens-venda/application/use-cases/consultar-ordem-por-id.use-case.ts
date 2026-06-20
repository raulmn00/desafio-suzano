import { OrdemVendaNaoEncontradaError } from '../../domain/ordem-venda.errors';
import { OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { apresentarOrdem, OrdemVendaView } from '../ordem-venda.presenter';

export class ConsultarOrdemPorIdUseCase {
  constructor(private readonly repositorio: OrdemVendaRepository) {}

  async executar(id: string): Promise<OrdemVendaView> {
    const ordem = await this.repositorio.buscarPorId(id);
    if (!ordem) {
      throw new OrdemVendaNaoEncontradaError(id);
    }
    return apresentarOrdem(ordem);
  }
}
