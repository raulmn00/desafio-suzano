import { TipoTransporte } from '../domain/tipo-transporte.entity';

/** Forma de saída (view) de um tipo de transporte exposta pela aplicação. */
export interface TipoTransporteView {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export function apresentarTipoTransporte(tipo: TipoTransporte): TipoTransporteView {
  return {
    id: tipo.id,
    nome: tipo.nome,
    codigo: tipo.codigo,
    ativo: tipo.ativo,
    criadoEm: tipo.criadoEm.toISOString(),
    atualizadoEm: tipo.atualizadoEm.toISOString(),
  };
}
