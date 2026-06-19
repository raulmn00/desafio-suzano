import { TipoTransporteRepository } from '../../domain/tipo-transporte.repository';
import { apresentarTipoTransporte, TipoTransporteView } from '../tipo-transporte.presenter';

export class ConsultarTiposTransporteUseCase {
  constructor(private readonly repositorio: TipoTransporteRepository) {}

  async executar(): Promise<TipoTransporteView[]> {
    const tipos = await this.repositorio.listar();
    return tipos.map(apresentarTipoTransporte);
  }
}
