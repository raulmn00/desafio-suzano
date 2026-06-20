import { Clock } from '../../../../shared/application/ports/clock';
import { TipoTransporteNaoEncontradoError } from '../../../tipos-transporte/domain/tipo-transporte.errors';
import { TipoTransporteRepository } from '../../../tipos-transporte/domain/tipo-transporte.repository';
import { ClienteRepository } from '../../domain/cliente.repository';
import { ClienteNaoEncontradoError } from '../../domain/cliente.errors';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export interface AutorizarTipoTransporteInput {
  clienteId: string;
  tipoTransporteId: string;
}

/**
 * Autoriza um tipo de transporte para um cliente. Orquestra dois agregados via
 * ports: garante que o cliente E o tipo de transporte existem antes de
 * registrar a autorização — base da regra "OV só usa transporte autorizado".
 */
export class AutorizarTipoTransporteUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly tipoTransporteRepository: TipoTransporteRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: AutorizarTipoTransporteInput): Promise<ClienteView> {
    const cliente = await this.clienteRepository.buscarPorId(input.clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(input.clienteId);
    }

    const transporteExiste = await this.tipoTransporteRepository.existePorId(
      input.tipoTransporteId,
    );
    if (!transporteExiste) {
      throw new TipoTransporteNaoEncontradoError(input.tipoTransporteId);
    }

    cliente.autorizarTransporte(input.tipoTransporteId, this.clock.agora());
    await this.clienteRepository.salvar(cliente);
    return apresentarCliente(cliente);
  }
}
