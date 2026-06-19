import { Item as ItemPrisma } from '@prisma/client';
import { Item } from '../../domain/item.entity';

/** Tradução bidirecional entre o registro do Prisma e a entidade de domínio. */
export class ItemMapper {
  static toDomain(raw: ItemPrisma): Item {
    return Item.restaurar({
      id: raw.id,
      sku: raw.sku,
      descricao: raw.descricao,
      unidade: raw.unidade,
      ativo: raw.ativo,
      criadoEm: raw.criadoEm,
    });
  }

  static toPersistence(item: Item): ItemPrisma {
    return {
      id: item.id,
      sku: item.sku,
      descricao: item.descricao,
      unidade: item.unidade,
      ativo: item.ativo,
      criadoEm: item.criadoEm,
    };
  }
}
