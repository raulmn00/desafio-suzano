import { AuditEvent } from '../domain/audit-event.entity';

export interface AuditEventView {
  id: string;
  ocorridoEm: string;
  ator: string;
  acao: string;
  entidadeTipo: string;
  entidadeId: string;
  estadoAnterior: Record<string, unknown> | null;
  estadoPosterior: Record<string, unknown> | null;
  correlationId: string | null;
}

export function apresentarAuditEvent(evento: AuditEvent): AuditEventView {
  return {
    id: evento.id,
    ocorridoEm: evento.ocorridoEm.toISOString(),
    ator: evento.ator,
    acao: evento.acao,
    entidadeTipo: evento.entidadeTipo,
    entidadeId: evento.entidadeId,
    estadoAnterior: evento.estadoAnterior,
    estadoPosterior: evento.estadoPosterior,
    correlationId: evento.correlationId,
  };
}
