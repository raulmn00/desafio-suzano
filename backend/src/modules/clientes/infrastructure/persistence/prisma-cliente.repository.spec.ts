import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { Cliente } from '../../domain/cliente.entity';
import { PrismaClienteRepository } from './prisma-cliente.repository';

function criarMockPrisma() {
  const cliente = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const clienteTipoTransporte = {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  };
  const prisma = {
    client: { cliente, clienteTipoTransporte },
    runInTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
  } as unknown as PrismaService;
  return { prisma, cliente, clienteTipoTransporte };
}

const data = new Date('2026-06-19T00:00:00.000Z');
const raw = {
  id: 'c-1',
  nome: 'Acme',
  documento: '52998224725',
  ativo: true,
  criadoEm: data,
  atualizadoEm: data,
  transportesAutorizados: [{ clienteId: 'c-1', tipoTransporteId: 't-1', autorizadoEm: data }],
};

describe('PrismaClienteRepository', () => {
  it('salvar faz upsert e recria as autorizações quando há transportes', async () => {
    const { prisma, cliente, clienteTipoTransporte } = criarMockPrisma();
    const repo = new PrismaClienteRepository(prisma);
    const entidade = Cliente.restaurar({
      id: 'c-1',
      nome: 'Acme',
      documento: '52998224725',
      ativo: true,
      transportesAutorizados: ['t-1'],
      criadoEm: data,
      atualizadoEm: data,
    });

    await repo.salvar(entidade);

    expect(cliente.upsert).toHaveBeenCalled();
    expect(clienteTipoTransporte.deleteMany).toHaveBeenCalledWith({ where: { clienteId: 'c-1' } });
    expect(clienteTipoTransporte.createMany).toHaveBeenCalledWith({
      data: [{ clienteId: 'c-1', tipoTransporteId: 't-1' }],
      skipDuplicates: true,
    });
  });

  it('salvar não chama createMany quando não há transportes', async () => {
    const { prisma, clienteTipoTransporte } = criarMockPrisma();
    const repo = new PrismaClienteRepository(prisma);
    const entidade = Cliente.criar({ id: 'c-2', nome: 'Beta', documento: '11222333000181', agora: data });

    await repo.salvar(entidade);

    expect(clienteTipoTransporte.deleteMany).toHaveBeenCalled();
    expect(clienteTipoTransporte.createMany).not.toHaveBeenCalled();
  });

  it('buscarPorId mapeia o cliente com transportes', async () => {
    const { prisma, cliente } = criarMockPrisma();
    cliente.findUnique.mockResolvedValue(raw);
    const repo = new PrismaClienteRepository(prisma);

    const encontrado = await repo.buscarPorId('c-1');

    expect(encontrado?.transportesAutorizados).toEqual(['t-1']);
  });

  it('buscarPorId retorna null quando não encontra', async () => {
    const { prisma, cliente } = criarMockPrisma();
    cliente.findUnique.mockResolvedValue(null);
    const repo = new PrismaClienteRepository(prisma);

    expect(await repo.buscarPorId('x')).toBeNull();
  });

  it('buscarPorDocumento mapeia e trata ausência', async () => {
    const { prisma, cliente } = criarMockPrisma();
    const repo = new PrismaClienteRepository(prisma);

    cliente.findUnique.mockResolvedValue(raw);
    expect((await repo.buscarPorDocumento('52998224725'))?.id).toBe('c-1');

    cliente.findUnique.mockResolvedValue(null);
    expect(await repo.buscarPorDocumento('000')).toBeNull();
  });

  it('listar mapeia todos os clientes', async () => {
    const { prisma, cliente } = criarMockPrisma();
    cliente.findMany.mockResolvedValue([raw]);
    const repo = new PrismaClienteRepository(prisma);

    expect(await repo.listar()).toHaveLength(1);
  });

  it('existePorId reflete a contagem', async () => {
    const { prisma, cliente } = criarMockPrisma();
    const repo = new PrismaClienteRepository(prisma);

    cliente.count.mockResolvedValue(1);
    expect(await repo.existePorId('c-1')).toBe(true);

    cliente.count.mockResolvedValue(0);
    expect(await repo.existePorId('x')).toBe(false);
  });
});
