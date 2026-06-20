import { http } from '../../lib/http';
import {
  tipoTransporteListSchema,
  tipoTransporteSchema,
  type TipoTransporte,
  type TipoTransporteFormValues,
} from './schema';

export async function listarTiposTransporte(): Promise<TipoTransporte[]> {
  const { data } = await http.get('/tipos-transporte');
  return tipoTransporteListSchema.parse(data);
}

export async function obterTipoTransporte(id: string): Promise<TipoTransporte> {
  const { data } = await http.get(`/tipos-transporte/${id}`);
  return tipoTransporteSchema.parse(data);
}

export async function criarTipoTransporte(values: TipoTransporteFormValues): Promise<TipoTransporte> {
  const { data } = await http.post('/tipos-transporte', values);
  return tipoTransporteSchema.parse(data);
}

export async function atualizarTipoTransporte(
  id: string,
  values: Partial<TipoTransporteFormValues>,
): Promise<TipoTransporte> {
  const { data } = await http.patch(`/tipos-transporte/${id}`, values);
  return tipoTransporteSchema.parse(data);
}
