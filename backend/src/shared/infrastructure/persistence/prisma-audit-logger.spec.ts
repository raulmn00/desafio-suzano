import { Prisma } from '@prisma/client';
import { AcaoAuditoria, EntidadeAuditavel } from '../../application/ports/audit-logger';
import { Clock } from '../../application/ports/clock';
import { IdGenerator } from '../../application/ports/id-generator';
import { PrismaAuditLogger } from './prisma-audit-logger';
import { PrismaService } from './prisma.service';

describe('PrismaAuditLogger', () => {
  const ocorridoEm = new Date('2026-06-19T12:00:00.000Z');
  let create: jest.Mock;
  let logger: PrismaAuditLogger;

  beforeEach(() => {
    create = jest.fn().mockResolvedValue(undefined);
    const prisma = { client: { auditEvent: { create } } } as unknown as PrismaService;
    const clock = { agora: () => ocorridoEm } as Clock;
    const idGenerator = { gerar: () => 'audit-1' } as IdGenerator;
    logger = new PrismaAuditLogger(prisma, clock, idGenerator);
  });

  it('grava o evento com estados anterior e posterior e correlationId', async () => {
    await logger.registrar({
      ator: 'operador@ovgs.dev',
      acao: AcaoAuditoria.ORDEM_VENDA_STATUS_ALTERADO,
      entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
      entidadeId: 'ov-1',
      estadoAnterior: { status: 'CRIADA' },
      estadoPosterior: { status: 'PLANEJADA' },
      correlationId: 'corr-1',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'audit-1',
        ocorridoEm,
        ator: 'operador@ovgs.dev',
        acao: AcaoAuditoria.ORDEM_VENDA_STATUS_ALTERADO,
        entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
        entidadeId: 'ov-1',
        estadoAnterior: { status: 'CRIADA' },
        estadoPosterior: { status: 'PLANEJADA' },
        correlationId: 'corr-1',
      },
    });
  });

  it('usa Prisma.JsonNull e correlationId null quando estados ausentes', async () => {
    await logger.registrar({
      ator: 'sistema',
      acao: AcaoAuditoria.ORDEM_VENDA_CRIADA,
      entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
      entidadeId: 'ov-2',
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        estadoAnterior: Prisma.JsonNull,
        estadoPosterior: Prisma.JsonNull,
        correlationId: null,
      }),
    });
  });
});
