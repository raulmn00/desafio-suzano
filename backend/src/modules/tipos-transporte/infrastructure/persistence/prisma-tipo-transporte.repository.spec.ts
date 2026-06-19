import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { TipoTransporte } from '../../domain/tipo-transporte.entity';
import { PrismaTipoTransporteRepository } from './prisma-tipo-transporte.repository';

function criarMockPrisma() {
  const tipoTransporte = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const prisma = { client: { tipoTransporte } } as unknown as PrismaService;
  return { prisma, tipoTransporte };
}

const raw = {
  id: 'tt-1',
  nome: 'Caminhão',
  codigo: 'CAM',
  ativo: true,
  criadoEm: new Date('2026-06-19T00:00:00.000Z'),
  atualizadoEm: new Date('2026-06-19T00:00:00.000Z'),
};

describe('PrismaTipoTransporteRepository', () => {
  it('salvar faz upsert com os dados mapeados', async () => {
    const { prisma, tipoTransporte } = criarMockPrisma();
    const repo = new PrismaTipoTransporteRepository(prisma);
    const tipo = TipoTransporte.restaurar(raw);

    await repo.salvar(tipo);

    expect(tipoTransporte.upsert).toHaveBeenCalledWith({
      where: { id: 'tt-1' },
      create: expect.objectContaining({ id: 'tt-1', codigo: 'CAM' }),
      update: expect.objectContaining({ id: 'tt-1', codigo: 'CAM' }),
    });
  });

  it('buscarPorId mapeia o registro encontrado', async () => {
    const { prisma, tipoTransporte } = criarMockPrisma();
    tipoTransporte.findUnique.mockResolvedValue(raw);
    const repo = new PrismaTipoTransporteRepository(prisma);

    const encontrado = await repo.buscarPorId('tt-1');

    expect(encontrado?.id).toBe('tt-1');
    expect(encontrado).toBeInstanceOf(TipoTransporte);
  });

  it('buscarPorId retorna null quando não encontra', async () => {
    const { prisma, tipoTransporte } = criarMockPrisma();
    tipoTransporte.findUnique.mockResolvedValue(null);
    const repo = new PrismaTipoTransporteRepository(prisma);

    expect(await repo.buscarPorId('x')).toBeNull();
  });

  it('buscarPorCodigo mapeia e retorna null adequadamente', async () => {
    const { prisma, tipoTransporte } = criarMockPrisma();
    const repo = new PrismaTipoTransporteRepository(prisma);

    tipoTransporte.findUnique.mockResolvedValue(raw);
    expect((await repo.buscarPorCodigo('CAM'))?.codigo).toBe('CAM');

    tipoTransporte.findUnique.mockResolvedValue(null);
    expect(await repo.buscarPorCodigo('NOPE')).toBeNull();
  });

  it('listar mapeia todos os registros', async () => {
    const { prisma, tipoTransporte } = criarMockPrisma();
    tipoTransporte.findMany.mockResolvedValue([raw, { ...raw, id: 'tt-2', codigo: 'CAR' }]);
    const repo = new PrismaTipoTransporteRepository(prisma);

    const lista = await repo.listar();

    expect(lista).toHaveLength(2);
    expect(lista[1].codigo).toBe('CAR');
  });

  it('existePorId retorna true/false conforme a contagem', async () => {
    const { prisma, tipoTransporte } = criarMockPrisma();
    const repo = new PrismaTipoTransporteRepository(prisma);

    tipoTransporte.count.mockResolvedValue(1);
    expect(await repo.existePorId('tt-1')).toBe(true);

    tipoTransporte.count.mockResolvedValue(0);
    expect(await repo.existePorId('x')).toBe(false);
  });
});
