import { TipoTransporteNaoEncontradoError } from '../../domain/tipo-transporte.errors';
import { TipoTransporteRepository } from '../../domain/tipo-transporte.repository';
import { apresentarTipoTransporte, TipoTransporteView } from '../tipo-transporte.presenter';

export class ConsultarTipoTransportePorIdUseCase {
  constructor(private readonly repositorio: TipoTransporteRepository) {}

  async executar(id: string): Promise<TipoTransporteView> {
    const tipo = await this.repositorio.buscarPorId(id);
    if (!tipo) {
      throw new TipoTransporteNaoEncontradoError(id);
    }
    return apresentarTipoTransporte(tipo);
  }
}
