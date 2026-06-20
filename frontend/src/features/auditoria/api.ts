import { http } from '../../lib/http';
import { auditEventListSchema, type AuditEvent } from './schema';

export interface FiltrosAuditoria {
  entidadeTipo?: string;
  entidadeId?: string;
  acao?: string;
  ocorridoDe?: string;
  ocorridoAte?: string;
}

export async function listarAuditoria(filtros: FiltrosAuditoria = {}): Promise<AuditEvent[]> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(filtros)) {
    if (v) params[k] = v;
  }
  const { data } = await http.get('/auditoria', { params });
  return auditEventListSchema.parse(data);
}
