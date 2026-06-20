import { AuditEvent as AuditEventPrisma } from '@prisma/client';
import { AuditEvent } from '../../domain/audit-event.entity';

export class AuditEventMapper {
  static toDomain(raw: AuditEventPrisma): AuditEvent {
    return AuditEvent.restaurar({
      id: raw.id,
      ocorridoEm: raw.ocorridoEm,
      ator: raw.ator,
      acao: raw.acao,
      entidadeTipo: raw.entidadeTipo,
      entidadeId: raw.entidadeId,
      estadoAnterior: raw.estadoAnterior as unknown as Record<string, unknown> | null,
      estadoPosterior: raw.estadoPosterior as unknown as Record<string, unknown> | null,
      correlationId: raw.correlationId,
    });
  }
}
