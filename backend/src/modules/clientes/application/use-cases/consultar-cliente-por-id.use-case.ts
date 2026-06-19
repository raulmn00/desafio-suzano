import { ClienteRepository } from '../../domain/cliente.repository';
import { ClienteNaoEncontradoError } from '../../domain/cliente.errors';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export class ConsultarClientePorIdUseCase {
  constructor(private readonly repositorio: ClienteRepository) {}

  async executar(id: string): Promise<ClienteView> {
    const cliente = await this.repositorio.buscarPorId(id);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(id);
    }
    return apresentarCliente(cliente);
  }
}
