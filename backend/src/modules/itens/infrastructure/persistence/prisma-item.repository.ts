import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { Item } from '../../domain/item.entity';
import { ItemRepository } from '../../domain/item.repository';
import { ItemMapper } from './item.mapper';

@Injectable()
export class PrismaItemRepository extends ItemRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async salvar(item: Item): Promise<void> {
    const dados = ItemMapper.toPersistence(item);
    await this.prisma.client.item.upsert({
      where: { id: dados.id },
      create: dados,
      update: dados,
    });
  }

  async buscarPorId(id: string): Promise<Item | null> {
    const raw = await this.prisma.client.item.findUnique({ where: { id } });
    return raw ? ItemMapper.toDomain(raw) : null;
  }

  async buscarPorSku(sku: string): Promise<Item | null> {
    const raw = await this.prisma.client.item.findUnique({ where: { sku } });
    return raw ? ItemMapper.toDomain(raw) : null;
  }

  async listar(): Promise<Item[]> {
    const registros = await this.prisma.client.item.findMany({
      orderBy: { criadoEm: 'asc' },
    });
    return registros.map(ItemMapper.toDomain);
  }

  async existePorId(id: string): Promise<boolean> {
    const total = await this.prisma.client.item.count({ where: { id } });
    return total > 0;
  }

  async buscarVariosPorIds(ids: string[]): Promise<Item[]> {
    const registros = await this.prisma.client.item.findMany({
      where: { id: { in: ids } },
    });
    return registros.map(ItemMapper.toDomain);
  }
}
