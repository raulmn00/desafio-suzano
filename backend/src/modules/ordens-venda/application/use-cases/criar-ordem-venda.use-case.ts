import {
  AcaoAuditoria,
  AuditLogger,
  EntidadeAuditavel,
} from '../../../../shared/application/ports/audit-logger';
import { Clock } from '../../../../shared/application/ports/clock';
import { EventPublisher } from '../../../../shared/application/ports/event-publisher';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { TransactionManager } from '../../../../shared/application/ports/transaction-manager';
import { ClienteNaoEncontradoError } from '../../../clientes/domain/cliente.errors';
import { ClienteRepository } from '../../../clientes/domain/cliente.repository';
import { ItemNaoEncontradoError } from '../../../itens/domain/item.errors';
import { ItemRepository } from '../../../itens/domain/item.repository';
import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import { OrdemVendaCriadaEvent } from '../../domain/events/ordem-venda.events';
import { TransporteNaoAutorizadoError } from '../../domain/ordem-venda.errors';
import { OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { apresentarOrdem, OrdemVendaView, snapshotOrdem } from '../ordem-venda.presenter';

export interface CriarOrdemVendaInput {
  clienteId: string;
  tipoTransporteId: string;
  itens: Array<{ itemId: string; quantidade: number }>;
  ator: string;
}

/**
 * Cria uma Ordem de Venda. Aqui mora a regra de negócio central: a OV só nasce
 * se o tipo de transporte estiver AUTORIZADO para o cliente. Também garante que
 * todos os itens existem. Persistência + auditoria ocorrem na mesma transação.
 */
export class CriarOrdemVendaUseCase {
  constructor(
    private readonly ordemRepository: OrdemVendaRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly itemRepository: ItemRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly auditLogger: AuditLogger,
    private readonly transactionManager: TransactionManager,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async executar(input: CriarOrdemVendaInput): Promise<OrdemVendaView> {
    const cliente = await this.clienteRepository.buscarPorId(input.clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(input.clienteId);
    }

    if (!cliente.transporteEstaAutorizado(input.tipoTransporteId)) {
      throw new TransporteNaoAutorizadoError(input.tipoTransporteId);
    }

    const itemIds = [...new Set(input.itens.map((i) => i.itemId))];
    const encontrados = await this.itemRepository.buscarVariosPorIds(itemIds);
    const existentes = new Set(encontrados.map((i) => i.id));
    const faltantes = itemIds.filter((id) => !existentes.has(id));
    if (faltantes.length > 0) {
      throw new ItemNaoEncontradoError(faltantes[0]);
    }

    const ordem = OrdemDeVenda.criar({
      id: this.idGenerator.gerar(),
      clienteId: input.clienteId,
      tipoTransporteId: input.tipoTransporteId,
      itens: input.itens,
      agora: this.clock.agora(),
    });

    await this.transactionManager.executar(async () => {
      await this.ordemRepository.salvar(ordem);
      await this.auditLogger.registrar({
        ator: input.ator,
        acao: AcaoAuditoria.ORDEM_VENDA_CRIADA,
        entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
        entidadeId: ordem.id,
        estadoAnterior: null,
        estadoPosterior: snapshotOrdem(ordem),
      });
    });

    // Pós-commit: evento de domínio para efeitos colaterais desacoplados
    // (notificações, projeções, métricas) — fora da transação de auditoria.
    this.eventPublisher.publicar(
      new OrdemVendaCriadaEvent(ordem.id, ordem.clienteId, input.ator, this.clock.agora()),
    );

    return apresentarOrdem(ordem);
  }
}
