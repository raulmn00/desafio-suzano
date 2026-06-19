import { ItemRepository } from '../../domain/item.repository';
import { apresentarItem, ItemView } from '../item.presenter';

export class ConsultarItensUseCase {
  constructor(private readonly repositorio: ItemRepository) {}

  async executar(): Promise<ItemView[]> {
    const itens = await this.repositorio.listar();
    return itens.map(apresentarItem);
  }
}
