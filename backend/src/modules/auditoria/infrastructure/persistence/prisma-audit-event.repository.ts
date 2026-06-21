import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { Paginacao, paginaSkip, ResultadoPaginado } from '../../../../shared/domain/pagination';
import { AuditEvent } from '../../domain/audit-event.entity';
import { AuditEventRepository, FiltrosAuditoria } from '../../domain/audit-event.repository';
import { AuditEventMapper } from './audit-event.mapper';

@Injectable()
export class PrismaAuditEventRepository extends AuditEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async consultar(
    filtros: FiltrosAuditoria,
    paginacao: Paginacao,
  ): Promise<ResultadoPaginado<AuditEvent>> {
    const where: Prisma.AuditEventWhereInput = {
      entidadeTipo: filtros.entidadeTipo,
      entidadeId: filtros.entidadeId,
      acao: filtros.acao,
      ocorridoEm:
        filtros.ocorridoDe || filtros.ocorridoAte
          ? { gte: filtros.ocorridoDe, lte: filtros.ocorridoAte }
          : undefined,
    };

    const [registros, total] = await Promise.all([
      this.prisma.client.auditEvent.findMany({
        where,
        orderBy: { ocorridoEm: 'desc' },
        skip: paginaSkip(paginacao),
        take: paginacao.limit,
      }),
      this.prisma.client.auditEvent.count({ where }),
    ]);
    return { itens: registros.map(AuditEventMapper.toDomain), total };
  }
}
