import { Clock } from '../../../../shared/application/ports/clock';
import { TipoTransporte } from '../../domain/tipo-transporte.entity';
import {
  CodigoTransporteJaCadastradoError,
  TipoTransporteNaoEncontradoError,
} from '../../domain/tipo-transporte.errors';
import { TipoTransporteRepository } from '../../domain/tipo-transporte.repository';
import { apresentarTipoTransporte, TipoTransporteView } from '../tipo-transporte.presenter';

export interface EditarTipoTransporteInput {
  id: string;
  nome?: string;
  codigo?: string;
}

export class EditarTipoTransporteUseCase {
  constructor(
    private readonly repositorio: TipoTransporteRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: EditarTipoTransporteInput): Promise<TipoTransporteView> {
    const tipo = await this.repositorio.buscarPorId(input.id);
    if (!tipo) {
      throw new TipoTransporteNaoEncontradoError(input.id);
    }

    // Garante unicidade do código ANTES de mutar a entidade (evita mutação
    // parcial em caso de conflito).
    if (input.codigo !== undefined) {
      const novoCodigo = TipoTransporte.normalizarCodigo(input.codigo);
      const existente = await this.repositorio.buscarPorCodigo(novoCodigo);
      if (existente && existente.id !== tipo.id) {
        throw new CodigoTransporteJaCadastradoError(novoCodigo);
      }
    }

    tipo.editar({ nome: input.nome, codigo: input.codigo }, this.clock.agora());
    await this.repositorio.salvar(tipo);
    return apresentarTipoTransporte(tipo);
  }
}
