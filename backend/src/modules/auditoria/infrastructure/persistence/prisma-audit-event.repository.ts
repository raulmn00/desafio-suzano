import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { AuditEvent } from '../../domain/audit-event.entity';
import {
  AuditEventRepository,
  FiltrosAuditoria,
} from '../../domain/audit-event.repository';
import { AuditEventMapper } from './audit-event.mapper';

const LIMITE_PADRAO = 500;

@Injectable()
export class PrismaAuditEventRepository extends AuditEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async consultar(filtros: FiltrosAuditoria): Promise<AuditEvent[]> {
    const where: Prisma.AuditEventWhereInput = {
      entidadeTipo: filtros.entidadeTipo,
      entidadeId: filtros.entidadeId,
      acao: filtros.acao,
      ocorridoEm:
        filtros.ocorridoDe || filtros.ocorridoAte
          ? { gte: filtros.ocorridoDe, lte: filtros.ocorridoAte }
          : undefined,
    };

    const registros = await this.prisma.client.auditEvent.findMany({
      where,
      orderBy: { ocorridoEm: 'desc' },
      take: LIMITE_PADRAO,
    });
    return registros.map(AuditEventMapper.toDomain);
  }
}
