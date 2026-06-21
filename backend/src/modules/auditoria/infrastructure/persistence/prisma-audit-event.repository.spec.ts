import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { PrismaAuditEventRepository } from './prisma-audit-event.repository';

function criarMockPrisma() {
  const auditEvent = { findMany: jest.fn(), count: jest.fn() };
  const prisma = { client: { auditEvent } } as unknown as PrismaService;
  return { prisma, auditEvent };
}

const ocorridoEm = new Date('2026-06-19T12:00:00.000Z');
const raw = {
  id: 'a1',
  ocorridoEm,
  ator: 'op@ovgs.dev',
  acao: 'ORDEM_VENDA_CRIADA',
  entidadeTipo: 'ORDEM_VENDA',
  entidadeId: 'o1',
  estadoAnterior: null,
  estadoPosterior: { status: 'CRIADA' },
  correlationId: null,
};

describe('PrismaAuditEventRepository', () => {
  it('consulta com filtros, período e paginação (skip/take + count)', async () => {
    const { prisma, auditEvent } = criarMockPrisma();
    auditEvent.findMany.mockResolvedValue([raw]);
    auditEvent.count.mockResolvedValue(1);
    const repo = new PrismaAuditEventRepository(prisma);

    const resultado = await repo.consultar(
      { entidadeTipo: 'ORDEM_VENDA', ocorridoDe: ocorridoEm, ocorridoAte: ocorridoEm },
      { page: 3, limit: 5 },
    );

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.total).toBe(1);
    expect(resultado.itens[0].estadoPosterior).toEqual({ status: 'CRIADA' });
    expect(auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entidadeTipo: 'ORDEM_VENDA',
          ocorridoEm: { gte: ocorridoEm, lte: ocorridoEm },
        }),
        orderBy: { ocorridoEm: 'desc' },
        skip: 10,
        take: 5,
      }),
    );
  });

  it('consulta sem período usa ocorridoEm undefined', async () => {
    const { prisma, auditEvent } = criarMockPrisma();
    auditEvent.findMany.mockResolvedValue([]);
    auditEvent.count.mockResolvedValue(0);
    const repo = new PrismaAuditEventRepository(prisma);

    await repo.consultar({}, { page: 1, limit: 20 });

    expect(auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ocorridoEm: undefined }) }),
    );
  });

  it('consulta apenas com ocorridoAte monta o range (limite superior)', async () => {
    const { prisma, auditEvent } = criarMockPrisma();
    auditEvent.findMany.mockResolvedValue([]);
    auditEvent.count.mockResolvedValue(0);
    const repo = new PrismaAuditEventRepository(prisma);

    await repo.consultar({ ocorridoAte: ocorridoEm }, { page: 1, limit: 20 });

    expect(auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ocorridoEm: { gte: undefined, lte: ocorridoEm } }),
      }),
    );
  });
});
