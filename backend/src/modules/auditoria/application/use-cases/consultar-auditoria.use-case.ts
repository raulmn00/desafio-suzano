import {
  montarPagina,
  Pagina,
  Paginacao,
  resolverPaginacao,
} from '../../../../shared/domain/pagination';
import { AuditEventRepository, FiltrosAuditoria } from '../../domain/audit-event.repository';
import { apresentarAuditEvent, AuditEventView } from '../audit-event.presenter';

export class ConsultarAuditoriaUseCase {
  constructor(private readonly repositorio: AuditEventRepository) {}

  async executar(
    filtros: FiltrosAuditoria,
    paginacao: Paginacao = resolverPaginacao(),
  ): Promise<Pagina<AuditEventView>> {
    const { itens, total } = await this.repositorio.consultar(filtros, paginacao);
    return montarPagina(itens.map(apresentarAuditEvent), total, paginacao);
  }
}
