import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { PrismaAuditEventRepository } from './prisma-audit-event.repository';

function criarMockPrisma() {
  const auditEvent = { findMany: jest.fn() };
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
  it('consulta com filtros e período mapeando o resultado', async () => {
    const { prisma, auditEvent } = criarMockPrisma();
    auditEvent.findMany.mockResolvedValue([raw]);
    const repo = new PrismaAuditEventRepository(prisma);

    const lista = await repo.consultar({
      entidadeTipo: 'ORDEM_VENDA',
      ocorridoDe: ocorridoEm,
      ocorridoAte: ocorridoEm,
    });

    expect(lista).toHaveLength(1);
    expect(lista[0].estadoPosterior).toEqual({ status: 'CRIADA' });
    expect(auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entidadeTipo: 'ORDEM_VENDA',
          ocorridoEm: { gte: ocorridoEm, lte: ocorridoEm },
        }),
        orderBy: { ocorridoEm: 'desc' },
      }),
    );
  });

  it('consulta sem período usa ocorridoEm undefined', async () => {
    const { prisma, auditEvent } = criarMockPrisma();
    auditEvent.findMany.mockResolvedValue([]);
    const repo = new PrismaAuditEventRepository(prisma);

    await repo.consultar({});

    expect(auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ocorridoEm: undefined }) }),
    );
  });

  it('consulta apenas com ocorridoAte monta o range (limite superior)', async () => {
    const { prisma, auditEvent } = criarMockPrisma();
    auditEvent.findMany.mockResolvedValue([]);
    const repo = new PrismaAuditEventRepository(prisma);

    await repo.consultar({ ocorridoAte: ocorridoEm });

    expect(auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ocorridoEm: { gte: undefined, lte: ocorridoEm } }),
      }),
    );
  });
});
