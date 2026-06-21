import { Cache } from '../../../../shared/application/ports/cache';
import { TipoTransporteRepository } from '../../domain/tipo-transporte.repository';
import { apresentarTipoTransporte, TipoTransporteView } from '../tipo-transporte.presenter';

export const CHAVE_CACHE_TIPOS = 'tipos-transporte:lista';

export class ConsultarTiposTransporteUseCase {
  constructor(
    private readonly repositorio: TipoTransporteRepository,
    private readonly cache: Cache,
    private readonly ttlMs: number,
  ) {}

  async executar(): Promise<TipoTransporteView[]> {
    const cacheado = await this.cache.get<TipoTransporteView[]>(CHAVE_CACHE_TIPOS);
    if (cacheado) {
      return cacheado;
    }
    const views = (await this.repositorio.listar()).map(apresentarTipoTransporte);
    await this.cache.set(CHAVE_CACHE_TIPOS, views, this.ttlMs);
    return views;
  }
}
