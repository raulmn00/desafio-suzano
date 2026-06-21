import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { PrismaOrdemVendaRepository } from './prisma-ordem-venda.repository';

function criarMockPrisma() {
  const ordemVenda = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const itemOrdemVenda = { deleteMany: jest.fn(), createMany: jest.fn() };
  const agendamento = { upsert: jest.fn(), deleteMany: jest.fn() };
  const prisma = {
    client: { ordemVenda, itemOrdemVenda, agendamento },
    runInTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
  } as unknown as PrismaService;
  return { prisma, ordemVenda, itemOrdemVenda, agendamento };
}

const criadoEm = new Date('2026-06-19T00:00:00.000Z');
const dataEntrega = new Date('2026-06-25T00:00:00.000Z');

const rawBase = {
  id: 'o1',
  clienteId: 'c1',
  tipoTransporteId: 't1',
  status: StatusOrdemVenda.CRIADA,
  criadoEm,
  atualizadoEm: criadoEm,
  itens: [{ id: 'o1:i1', ordemVendaId: 'o1', itemId: 'i1', quantidade: 2 }],
  agendamento: null as unknown,
};

describe('PrismaOrdemVendaRepository', () => {
  it('salvar com agendamento: upsert OV, recria itens e upserta agendamento', async () => {
    const { prisma, ordemVenda, itemOrdemVenda, agendamento } = criarMockPrisma();
    const repo = new PrismaOrdemVendaRepository(prisma);
    const ordem = OrdemDeVenda.restaurar({
      id: 'o1',
      clienteId: 'c1',
      tipoTransporteId: 't1',
      status: StatusOrdemVenda.AGENDADA,
      itens: [{ itemId: 'i1', quantidade: 2 }],
      agendamento: { dataEntrega, janelaInicio: '08:00', janelaFim: '12:00', confirmado: true },
      criadoEm,
      atualizadoEm: criadoEm,
    });

    await repo.salvar(ordem);

    expect(ordemVenda.upsert).toHaveBeenCalled();
    expect(itemOrdemVenda.deleteMany).toHaveBeenCalledWith({ where: { ordemVendaId: 'o1' } });
    expect(itemOrdemVenda.createMany).toHaveBeenCalledWith({
      data: [{ id: 'o1:i1', ordemVendaId: 'o1', itemId: 'i1', quantidade: 2 }],
    });
    expect(agendamento.upsert).toHaveBeenCalled();
    expect(agendamento.deleteMany).not.toHaveBeenCalled();
  });

  it('salvar sem agendamento: remove agendamento existente', async () => {
    const { prisma, agendamento } = criarMockPrisma();
    const repo = new PrismaOrdemVendaRepository(prisma);
    const ordem = OrdemDeVenda.restaurar({
      id: 'o1',
      clienteId: 'c1',
      tipoTransporteId: 't1',
      status: StatusOrdemVenda.CRIADA,
      itens: [{ itemId: 'i1', quantidade: 1 }],
      agendamento: null,
      criadoEm,
      atualizadoEm: criadoEm,
    });

    await repo.salvar(ordem);

    expect(agendamento.deleteMany).toHaveBeenCalledWith({ where: { ordemVendaId: 'o1' } });
    expect(agendamento.upsert).not.toHaveBeenCalled();
  });

  it('buscarPorId mapeia a ordem com relações', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    ordemVenda.findUnique.mockResolvedValue(rawBase);
    const repo = new PrismaOrdemVendaRepository(prisma);

    const ordem = await repo.buscarPorId('o1');

    expect(ordem?.itens).toEqual([{ itemId: 'i1', quantidade: 2 }]);
  });

  it('buscarPorId mapeia a ordem com agendamento', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    ordemVenda.findUnique.mockResolvedValue({
      ...rawBase,
      status: StatusOrdemVenda.AGENDADA,
      agendamento: {
        id: 'o1',
        ordemVendaId: 'o1',
        dataEntrega,
        janelaInicio: '08:00',
        janelaFim: '12:00',
        confirmado: true,
        criadoEm,
        atualizadoEm: criadoEm,
      },
    });
    const repo = new PrismaOrdemVendaRepository(prisma);

    const ordem = await repo.buscarPorId('o1');

    expect(ordem?.agendamento).toMatchObject({ janelaInicio: '08:00', confirmado: true });
  });

  it('buscarPorId retorna null quando não encontra', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    ordemVenda.findUnique.mockResolvedValue(null);
    const repo = new PrismaOrdemVendaRepository(prisma);

    expect(await repo.buscarPorId('x')).toBeNull();
  });

  it('listar aplica filtros com período e pagina (skip/take + count)', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    ordemVenda.findMany.mockResolvedValue([rawBase]);
    ordemVenda.count.mockResolvedValue(1);
    const repo = new PrismaOrdemVendaRepository(prisma);

    const resultado = await repo.listar(
      { status: StatusOrdemVenda.CRIADA, criadoDe: criadoEm, criadoAte: dataEntrega },
      { page: 2, limit: 10 },
    );

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.total).toBe(1);
    expect(ordemVenda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: StatusOrdemVenda.CRIADA,
          criadoEm: { gte: criadoEm, lte: dataEntrega },
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('listar sem período usa criadoEm undefined', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    ordemVenda.findMany.mockResolvedValue([]);
    ordemVenda.count.mockResolvedValue(0);
    const repo = new PrismaOrdemVendaRepository(prisma);

    await repo.listar({}, { page: 1, limit: 20 });

    expect(ordemVenda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ criadoEm: undefined }) }),
    );
  });

  it('listar apenas com criadoAte (limite superior) monta o range', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    ordemVenda.findMany.mockResolvedValue([]);
    ordemVenda.count.mockResolvedValue(0);
    const repo = new PrismaOrdemVendaRepository(prisma);

    await repo.listar({ criadoAte: dataEntrega }, { page: 1, limit: 20 });

    expect(ordemVenda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ criadoEm: { gte: undefined, lte: dataEntrega } }),
      }),
    );
  });

  it('existePorId reflete a contagem', async () => {
    const { prisma, ordemVenda } = criarMockPrisma();
    const repo = new PrismaOrdemVendaRepository(prisma);

    ordemVenda.count.mockResolvedValue(1);
    expect(await repo.existePorId('o1')).toBe(true);

    ordemVenda.count.mockResolvedValue(0);
    expect(await repo.existePorId('x')).toBe(false);
  });
});
