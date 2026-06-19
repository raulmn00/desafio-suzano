import { Cliente } from './cliente.entity';

export abstract class ClienteRepository {
  abstract salvar(cliente: Cliente): Promise<void>;
  abstract buscarPorId(id: string): Promise<Cliente | null>;
  abstract buscarPorDocumento(documento: string): Promise<Cliente | null>;
  abstract listar(): Promise<Cliente[]>;
  abstract existePorId(id: string): Promise<boolean>;
}
