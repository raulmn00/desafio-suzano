import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { Item } from '../../domain/item.entity';
import { PrismaItemRepository } from './prisma-item.repository';

function criarMockPrisma() {
  const item = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const prisma = { client: { item } } as unknown as PrismaService;
  return { prisma, item };
}

const raw = {
  id: 'item-1',
  sku: 'SKU-001',
  descricao: 'Papel A4',
  unidade: 'CX',
  ativo: true,
  criadoEm: new Date('2026-06-19T00:00:00.000Z'),
};

describe('PrismaItemRepository', () => {
  it('salvar faz upsert com os dados mapeados', async () => {
    const { prisma, item } = criarMockPrisma();
    const repo = new PrismaItemRepository(prisma);
    const entidade = Item.restaurar(raw);

    await repo.salvar(entidade);

    expect(item.upsert).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      create: expect.objectContaining({ id: 'item-1', sku: 'SKU-001' }),
      update: expect.objectContaining({ id: 'item-1', sku: 'SKU-001' }),
    });
  });

  it('buscarPorId mapeia o registro encontrado', async () => {
    const { prisma, item } = criarMockPrisma();
    item.findUnique.mockResolvedValue(raw);
    const repo = new PrismaItemRepository(prisma);

    const encontrado = await repo.buscarPorId('item-1');

    expect(encontrado?.id).toBe('item-1');
    expect(encontrado).toBeInstanceOf(Item);
  });

  it('buscarPorId retorna null quando não encontra', async () => {
    const { prisma, item } = criarMockPrisma();
    item.findUnique.mockResolvedValue(null);
    const repo = new PrismaItemRepository(prisma);

    expect(await repo.buscarPorId('x')).toBeNull();
  });

  it('buscarPorSku mapeia e retorna null adequadamente', async () => {
    const { prisma, item } = criarMockPrisma();
    const repo = new PrismaItemRepository(prisma);

    item.findUnique.mockResolvedValue(raw);
    expect((await repo.buscarPorSku('SKU-001'))?.sku).toBe('SKU-001');

    item.findUnique.mockResolvedValue(null);
    expect(await repo.buscarPorSku('NOPE')).toBeNull();
  });

  it('listar mapeia todos os registros', async () => {
    const { prisma, item } = criarMockPrisma();
    item.findMany.mockResolvedValue([raw, { ...raw, id: 'item-2', sku: 'SKU-002' }]);
    const repo = new PrismaItemRepository(prisma);

    const lista = await repo.listar();

    expect(lista).toHaveLength(2);
    expect(lista[1].sku).toBe('SKU-002');
  });

  it('existePorId retorna true/false conforme a contagem', async () => {
    const { prisma, item } = criarMockPrisma();
    const repo = new PrismaItemRepository(prisma);

    item.count.mockResolvedValue(1);
    expect(await repo.existePorId('item-1')).toBe(true);

    item.count.mockResolvedValue(0);
    expect(await repo.existePorId('x')).toBe(false);
  });

  it('buscarVariosPorIds usa findMany com filtro in e mapeia os registros', async () => {
    const { prisma, item } = criarMockPrisma();
    item.findMany.mockResolvedValue([raw, { ...raw, id: 'item-2', sku: 'SKU-002' }]);
    const repo = new PrismaItemRepository(prisma);

    const encontrados = await repo.buscarVariosPorIds(['item-1', 'item-2']);

    expect(item.findMany).toHaveBeenCalledWith({ where: { id: { in: ['item-1', 'item-2'] } } });
    expect(encontrados).toHaveLength(2);
    expect(encontrados[0]).toBeInstanceOf(Item);
  });
});
