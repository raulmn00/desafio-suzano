import {
  AcaoAuditoria,
  AuditLogger,
  EntidadeAuditavel,
} from '../../../../shared/application/ports/audit-logger';
import { Clock } from '../../../../shared/application/ports/clock';
import { TransactionManager } from '../../../../shared/application/ports/transaction-manager';
import { ClienteNaoEncontradoError } from '../../../clientes/domain/cliente.errors';
import { ClienteRepository } from '../../../clientes/domain/cliente.repository';
import {
  OrdemVendaNaoEncontradaError,
  TransporteNaoAutorizadoError,
} from '../../domain/ordem-venda.errors';
import { OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { apresentarOrdem, OrdemVendaView, snapshotOrdem } from '../ordem-venda.presenter';

export interface AlterarTransporteInput {
  id: string;
  tipoTransporteId: string;
  ator: string;
}

/**
 * Altera o tipo de transporte da OV — revalidando a regra de autorização do
 * cliente (não basta a OV existir; o novo transporte precisa estar autorizado).
 */
export class AlterarTransporteUseCase {
  constructor(
    private readonly ordemRepository: OrdemVendaRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly clock: Clock,
    private readonly auditLogger: AuditLogger,
    private readonly transactionManager: TransactionManager,
  ) {}

  async executar(input: AlterarTransporteInput): Promise<OrdemVendaView> {
    const ordem = await this.ordemRepository.buscarPorId(input.id);
    if (!ordem) {
      throw new OrdemVendaNaoEncontradaError(input.id);
    }

    const cliente = await this.clienteRepository.buscarPorId(ordem.clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(ordem.clienteId);
    }
    if (!cliente.transporteEstaAutorizado(input.tipoTransporteId)) {
      throw new TransporteNaoAutorizadoError(input.tipoTransporteId);
    }

    const estadoAnterior = snapshotOrdem(ordem);
    ordem.alterarTransporte(input.tipoTransporteId, this.clock.agora());

    await this.transactionManager.executar(async () => {
      await this.ordemRepository.salvar(ordem);
      await this.auditLogger.registrar({
        ator: input.ator,
        acao: AcaoAuditoria.ORDEM_VENDA_TRANSPORTE_ALTERADO,
        entidadeTipo: EntidadeAuditavel.ORDEM_VENDA,
        entidadeId: ordem.id,
        estadoAnterior,
        estadoPosterior: snapshotOrdem(ordem),
      });
    });

    return apresentarOrdem(ordem);
  }
}
