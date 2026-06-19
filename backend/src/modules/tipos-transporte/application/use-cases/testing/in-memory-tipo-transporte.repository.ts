import { TipoTransporte } from '../../../domain/tipo-transporte.entity';
import { TipoTransporteRepository } from '../../../domain/tipo-transporte.repository';

/** Repositório in-memory para testes de use-case (não vai para a cobertura de produção). */
export class InMemoryTipoTransporteRepository extends TipoTransporteRepository {
  readonly itens = new Map<string, TipoTransporte>();

  async salvar(tipoTransporte: TipoTransporte): Promise<void> {
    this.itens.set(tipoTransporte.id, tipoTransporte);
  }

  async buscarPorId(id: string): Promise<TipoTransporte | null> {
    return this.itens.get(id) ?? null;
  }

  async buscarPorCodigo(codigo: string): Promise<TipoTransporte | null> {
    for (const tipo of this.itens.values()) {
      if (tipo.codigo === codigo) {
        return tipo;
      }
    }
    return null;
  }

  async listar(): Promise<TipoTransporte[]> {
    return [...this.itens.values()];
  }

  async existePorId(id: string): Promise<boolean> {
    return this.itens.has(id);
  }
}
