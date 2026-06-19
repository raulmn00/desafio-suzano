import { ItemNaoEncontradoError } from '../../domain/item.errors';
import { ItemRepository } from '../../domain/item.repository';
import { apresentarItem, ItemView } from '../item.presenter';

export class ConsultarItemPorIdUseCase {
  constructor(private readonly repositorio: ItemRepository) {}

  async executar(id: string): Promise<ItemView> {
    const item = await this.repositorio.buscarPorId(id);
    if (!item) {
      throw new ItemNaoEncontradoError(id);
    }
    return apresentarItem(item);
  }
}
