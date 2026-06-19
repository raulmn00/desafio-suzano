import { Cliente } from '../../../domain/cliente.entity';
import { ClienteRepository } from '../../../domain/cliente.repository';

export class InMemoryClienteRepository extends ClienteRepository {
  readonly itens = new Map<string, Cliente>();

  async salvar(cliente: Cliente): Promise<void> {
    this.itens.set(cliente.id, cliente);
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    return this.itens.get(id) ?? null;
  }

  async buscarPorDocumento(documento: string): Promise<Cliente | null> {
    for (const cliente of this.itens.values()) {
      if (cliente.documento.valor === documento) {
        return cliente;
      }
    }
    return null;
  }

  async listar(): Promise<Cliente[]> {
    return [...this.itens.values()];
  }

  async existePorId(id: string): Promise<boolean> {
    return this.itens.has(id);
  }
}
