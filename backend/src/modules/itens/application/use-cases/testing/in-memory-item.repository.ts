import { Item } from '../../../domain/item.entity';
import { ItemRepository } from '../../../domain/item.repository';

/** Repositório in-memory para testes de use-case (não vai para a cobertura de produção). */
export class InMemoryItemRepository extends ItemRepository {
  readonly itens = new Map<string, Item>();

  async salvar(item: Item): Promise<void> {
    this.itens.set(item.id, item);
  }

  async buscarPorId(id: string): Promise<Item | null> {
    return this.itens.get(id) ?? null;
  }

  async buscarPorSku(sku: string): Promise<Item | null> {
    for (const item of this.itens.values()) {
      if (item.sku === sku) {
        return item;
      }
    }
    return null;
  }

  async listar(): Promise<Item[]> {
    return [...this.itens.values()];
  }

  async existePorId(id: string): Promise<boolean> {
    return this.itens.has(id);
  }

  async buscarVariosPorIds(ids: string[]): Promise<Item[]> {
    return ids
      .map((id) => this.itens.get(id))
      .filter((item): item is Item => item !== undefined);
  }
}
