import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogger, RegistroAuditoria } from '../../application/ports/audit-logger';
import { Clock } from '../../application/ports/clock';
import { IdGenerator } from '../../application/ports/id-generator';
import { PrismaService } from './prisma.service';

/**
 * Grava o evento de auditoria append-only usando o client ativo do Prisma
 * (transacional quando dentro de `TransactionManager.executar`).
 */
@Injectable()
export class PrismaAuditLogger extends AuditLogger {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {
    super();
  }

  async registrar(registro: RegistroAuditoria): Promise<void> {
    await this.prisma.client.auditEvent.create({
      data: {
        id: this.idGenerator.gerar(),
        ocorridoEm: this.clock.agora(),
        ator: registro.ator,
        acao: registro.acao,
        entidadeTipo: registro.entidadeTipo,
        entidadeId: registro.entidadeId,
        estadoAnterior: this.toJson(registro.estadoAnterior),
        estadoPosterior: this.toJson(registro.estadoPosterior),
        correlationId: registro.correlationId ?? null,
      },
    });
  }

  private toJson(
    valor?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (valor === undefined || valor === null) {
      return Prisma.JsonNull;
    }
    return valor as Prisma.InputJsonValue;
  }
}
