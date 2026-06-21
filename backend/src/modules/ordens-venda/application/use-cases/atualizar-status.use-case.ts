import {
  AcaoAuditoria,
  AuditLogger,
  EntidadeAuditavel,
} from '../../../../shared/application/ports/audit-logger';
import { Clock } from '../../../../shared/application/ports/clock';
import { EventPublisher } from '../../../../shared/application/ports/event-publisher';
import { TransactionManager } from '../../../../shared/application/ports/transaction-manager';
import { OrdemVendaStatusAlteradoEvent } from '../../domain/events/ordem-venda.events';
import { OrdemVendaNaoEncontradaError } from '../../domain/ordem-venda.errors';
import { OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { apresentarOrdem, OrdemVendaView, snapshotOrdem } from '../ordem-venda.presenter';

export interface AtualizarStatusInput {
  id: string;
  status: StatusOrdemVenda;
  ator: string;
}

export class AtualizarStatusUseCase {
  constructor(
    private readonly repositorio: OrdemVendaRepository,
    private readonly clock: Clock,
    private readonly auditLogger: AuditLogger,
    private readonly transactionManager: TransactionManager,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async executar(input: AtualizarStatusInput): Promise<OrdemVendaView> {
    const ordem = await this.repositorio.buscarPorId(input.id);
    if (!ordem) {
      throw new OrdemVendaNaoEncontradaError(input.id);
    }

    const estadoAnterior = snapshotOrdem(ordem);
    const statusAnterior = ordem.status;
    ordem.transicionarPara(input.status, this.clock.agora());

    await this.transactionManager.executar(async () => {
      await this.repositorio.salvar(ordem);
      await this.auditLogger.registrar({
        ator: input.ator,
        acao: AcaoAuditoria.ORDEM_VENDA_STATUS_ALTERADO,
        entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
        entidadeId: ordem.id,
        estadoAnterior,
        estadoPosterior: snapshotOrdem(ordem),
      });
      // Outbox: evento gravado na MESMA transação (atômico). Relay entrega depois.
      await this.eventPublisher.publicar(
        new OrdemVendaStatusAlteradoEvent(
          ordem.id,
          statusAnterior,
          ordem.status,
          input.ator,
          this.clock.agora(),
        ),
      );
    });

    return apresentarOrdem(ordem);
  }
}
