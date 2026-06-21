import { Cache } from '../../../../shared/application/ports/cache';
import { ItemRepository } from '../../domain/item.repository';
import { apresentarItem, ItemView } from '../item.presenter';

export const CHAVE_CACHE_ITENS = 'itens:lista';

export class ConsultarItensUseCase {
  constructor(
    private readonly repositorio: ItemRepository,
    private readonly cache: Cache,
    private readonly ttlMs: number,
  ) {}

  async executar(): Promise<ItemView[]> {
    const cacheado = await this.cache.get<ItemView[]>(CHAVE_CACHE_ITENS);
    if (cacheado) {
      return cacheado;
    }
    const views = (await this.repositorio.listar()).map(apresentarItem);
    await this.cache.set(CHAVE_CACHE_ITENS, views, this.ttlMs);
    return views;
  }
}
