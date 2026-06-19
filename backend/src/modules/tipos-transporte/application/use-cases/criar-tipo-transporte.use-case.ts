import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { TipoTransporte } from '../../domain/tipo-transporte.entity';
import { CodigoTransporteJaCadastradoError } from '../../domain/tipo-transporte.errors';
import { TipoTransporteRepository } from '../../domain/tipo-transporte.repository';
import { apresentarTipoTransporte, TipoTransporteView } from '../tipo-transporte.presenter';

export interface CriarTipoTransporteInput {
  nome: string;
  codigo: string;
}

export class CriarTipoTransporteUseCase {
  constructor(
    private readonly repositorio: TipoTransporteRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async executar(input: CriarTipoTransporteInput): Promise<TipoTransporteView> {
    const tipo = TipoTransporte.criar({
      id: this.idGenerator.gerar(),
      nome: input.nome,
      codigo: input.codigo,
      agora: this.clock.agora(),
    });

    const existente = await this.repositorio.buscarPorCodigo(tipo.codigo);
    if (existente) {
      throw new CodigoTransporteJaCadastradoError(tipo.codigo);
    }

    await this.repositorio.salvar(tipo);
    return apresentarTipoTransporte(tipo);
  }
}
