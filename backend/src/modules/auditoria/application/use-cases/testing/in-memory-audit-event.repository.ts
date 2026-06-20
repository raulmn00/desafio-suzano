import { AuditEvent } from '../../../domain/audit-event.entity';
import { AuditEventRepository, FiltrosAuditoria } from '../../../domain/audit-event.repository';

export class InMemoryAuditEventRepository extends AuditEventRepository {
  readonly eventos: AuditEvent[] = [];

  async consultar(filtros: FiltrosAuditoria): Promise<AuditEvent[]> {
    return this.eventos.filter(
      (e) =>
        (filtros.entidadeTipo === undefined || e.entidadeTipo === filtros.entidadeTipo) &&
        (filtros.entidadeId === undefined || e.entidadeId === filtros.entidadeId) &&
        (filtros.acao === undefined || e.acao === filtros.acao) &&
        (filtros.ocorridoDe === undefined || e.ocorridoEm >= filtros.ocorridoDe) &&
        (filtros.ocorridoAte === undefined || e.ocorridoEm <= filtros.ocorridoAte),
    );
  }
}
