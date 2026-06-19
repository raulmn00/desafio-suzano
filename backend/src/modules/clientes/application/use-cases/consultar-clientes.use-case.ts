import { ClienteRepository } from '../../domain/cliente.repository';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export class ConsultarClientesUseCase {
  constructor(private readonly repositorio: ClienteRepository) {}

  async executar(): Promise<ClienteView[]> {
    const clientes = await this.repositorio.listar();
    return clientes.map(apresentarCliente);
  }
}
