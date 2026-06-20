import {
  AuditEventRepository,
  FiltrosAuditoria,
} from '../../domain/audit-event.repository';
import { apresentarAuditEvent, AuditEventView } from '../audit-event.presenter';

export class ConsultarAuditoriaUseCase {
  constructor(private readonly repositorio: AuditEventRepository) {}

  async executar(filtros: FiltrosAuditoria): Promise<AuditEventView[]> {
    const eventos = await this.repositorio.consultar(filtros);
    return eventos.map(apresentarAuditEvent);
  }
}
