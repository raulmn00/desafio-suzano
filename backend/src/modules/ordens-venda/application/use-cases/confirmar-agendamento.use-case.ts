import { AcaoAuditoria, AuditLogger, EntidadeAuditavel } from '../../../../shared/application/ports/audit-logger';
import { Clock } from '../../../../shared/application/ports/clock';
import { TransactionManager } from '../../../../shared/application/ports/transaction-manager';
import { OrdemVendaNaoEncontradaError } from '../../domain/ordem-venda.errors';
import { OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { apresentarOrdem, OrdemVendaView, snapshotOrdem } from '../ordem-venda.presenter';

export interface ConfirmarAgendamentoInput {
  id: string;
  ator: string;
}

export class ConfirmarAgendamentoUseCase {
  constructor(
    private readonly repositorio: OrdemVendaRepository,
    private readonly clock: Clock,
    private readonly auditLogger: AuditLogger,
    private readonly transactionManager: TransactionManager,
  ) {}

  async executar(input: ConfirmarAgendamentoInput): Promise<OrdemVendaView> {
    const ordem = await this.repositorio.buscarPorId(input.id);
    if (!ordem) {
      throw new OrdemVendaNaoEncontradaError(input.id);
    }

    const estadoAnterior = snapshotOrdem(ordem);
    ordem.confirmarAgendamento(this.clock.agora());

    await this.transactionManager.executar(async () => {
      await this.repositorio.salvar(ordem);
      await this.auditLogger.registrar({
        ator: input.ator,
        acao: AcaoAuditoria.ORDEM_VENDA_AGENDAMENTO_CONFIRMADO,
        entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
        entidadeId: ordem.id,
        estadoAnterior,
        estadoPosterior: snapshotOrdem(ordem),
      });
    });

    return apresentarOrdem(ordem);
  }
}
