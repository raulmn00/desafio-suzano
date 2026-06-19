import { Clock } from '../../../../shared/application/ports/clock';
import { ClienteRepository } from '../../domain/cliente.repository';
import { ClienteNaoEncontradoError } from '../../domain/cliente.errors';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export interface DesautorizarTipoTransporteInput {
  clienteId: string;
  tipoTransporteId: string;
}

export class DesautorizarTipoTransporteUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: DesautorizarTipoTransporteInput): Promise<ClienteView> {
    const cliente = await this.clienteRepository.buscarPorId(input.clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(input.clienteId);
    }

    cliente.desautorizarTransporte(input.tipoTransporteId, this.clock.agora());
    await this.clienteRepository.salvar(cliente);
    return apresentarCliente(cliente);
  }
}
