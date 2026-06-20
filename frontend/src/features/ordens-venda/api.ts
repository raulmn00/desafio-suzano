import { http } from '../../lib/http';
import {
  ordemVendaListSchema,
  ordemVendaSchema,
  type AgendamentoFormValues,
  type CriarOrdemFormValues,
  type OrdemVenda,
  type StatusOv,
} from './schema';

export interface FiltrosOrdem {
  status?: string;
  clienteId?: string;
  tipoTransporteId?: string;
  criadoDe?: string;
  criadoAte?: string;
}

export async function listarOrdens(filtros: FiltrosOrdem = {}): Promise<OrdemVenda[]> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(filtros)) {
    if (v) params[k] = v;
  }
  const { data } = await http.get('/ordens-venda', { params });
  return ordemVendaListSchema.parse(data);
}

export async function obterOrdem(id: string): Promise<OrdemVenda> {
  const { data } = await http.get(`/ordens-venda/${id}`);
  return ordemVendaSchema.parse(data);
}

export async function criarOrdem(values: CriarOrdemFormValues): Promise<OrdemVenda> {
  const { data } = await http.post('/ordens-venda', values);
  return ordemVendaSchema.parse(data);
}

export async function atualizarStatus(id: string, status: StatusOv): Promise<OrdemVenda> {
  const { data } = await http.patch(`/ordens-venda/${id}/status`, { status });
  return ordemVendaSchema.parse(data);
}

export async function alterarTransporte(id: string, tipoTransporteId: string): Promise<OrdemVenda> {
  const { data } = await http.patch(`/ordens-venda/${id}/transporte`, { tipoTransporteId });
  return ordemVendaSchema.parse(data);
}

// ---------- Central de agendamento ----------
export async function criarAgendamento(id: string, values: AgendamentoFormValues): Promise<OrdemVenda> {
  const { data } = await http.post(`/ordens-venda/${id}/agendamento`, values);
  return ordemVendaSchema.parse(data);
}

export async function reagendar(id: string, values: AgendamentoFormValues): Promise<OrdemVenda> {
  const { data } = await http.patch(`/ordens-venda/${id}/agendamento`, values);
  return ordemVendaSchema.parse(data);
}

export async function confirmarAgendamento(id: string): Promise<OrdemVenda> {
  const { data } = await http.post(`/ordens-venda/${id}/agendamento/confirmar`);
  return ordemVendaSchema.parse(data);
}
