import { http } from '../../lib/http';
import { paramsPaginacaoQuery, type Pagina, type ParamsPaginacao } from '../../lib/pagination';
import { auditEventPaginaSchema, type AuditEvent } from './schema';

export interface FiltrosAuditoria {
  entidadeTipo?: string;
  entidadeId?: string;
  acao?: string;
  ocorridoDe?: string;
  ocorridoAte?: string;
}

export async function listarAuditoria(
  filtros: FiltrosAuditoria = {},
  paginacao: ParamsPaginacao = {},
): Promise<Pagina<AuditEvent>> {
  const params: Record<string, string> = paramsPaginacaoQuery(paginacao);
  for (const [k, v] of Object.entries(filtros)) {
    if (v) params[k] = v;
  }
  const { data } = await http.get('/auditoria', { params });
  return auditEventPaginaSchema.parse(data);
}
