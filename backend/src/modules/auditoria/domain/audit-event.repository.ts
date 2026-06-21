import { Paginacao, ResultadoPaginado } from '../../../shared/domain/pagination';
import { AuditEvent } from './audit-event.entity';

export interface FiltrosAuditoria {
  entidadeTipo?: string;
  entidadeId?: string;
  acao?: string;
  ocorridoDe?: Date;
  ocorridoAte?: Date;
}

export abstract class AuditEventRepository {
  abstract consultar(
    filtros: FiltrosAuditoria,
    paginacao: Paginacao,
  ): Promise<ResultadoPaginado<AuditEvent>>;
}
