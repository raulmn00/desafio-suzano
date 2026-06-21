import { Cache } from '../../../../shared/application/ports/cache';
import { ClienteRepository } from '../../domain/cliente.repository';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export const CHAVE_CACHE_CLIENTES = 'clientes:lista';

export class ConsultarClientesUseCase {
  constructor(
    private readonly repositorio: ClienteRepository,
    private readonly cache: Cache,
    private readonly ttlMs: number,
  ) {}

  async executar(): Promise<ClienteView[]> {
    const cacheado = await this.cache.get<ClienteView[]>(CHAVE_CACHE_CLIENTES);
    if (cacheado) {
      return cacheado;
    }
    const views = (await this.repositorio.listar()).map(apresentarCliente);
    await this.cache.set(CHAVE_CACHE_CLIENTES, views, this.ttlMs);
    return views;
  }
}
