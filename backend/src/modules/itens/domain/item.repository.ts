import { Item } from './item.entity';

/**
 * Port de persistência de itens. Implementado na infraestrutura (Prisma) e por
 * um fake in-memory nos testes. É um `abstract class` para servir simultaneamente
 * de tipo e de token de injeção de dependência no NestJS.
 */
export abstract class ItemRepository {
  abstract salvar(item: Item): Promise<void>;
  abstract buscarPorId(id: string): Promise<Item | null>;
  abstract buscarPorSku(sku: string): Promise<Item | null>;
  abstract listar(): Promise<Item[]>;
  abstract existePorId(id: string): Promise<boolean>;
  abstract buscarVariosPorIds(ids: string[]): Promise<Item[]>;
}
