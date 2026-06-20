import { http } from '../../lib/http';
import { clienteListSchema, clienteSchema, type Cliente, type ClienteFormValues } from './schema';

export async function listarClientes(): Promise<Cliente[]> {
  const { data } = await http.get('/clientes');
  return clienteListSchema.parse(data);
}

export async function obterCliente(id: string): Promise<Cliente> {
  const { data } = await http.get(`/clientes/${id}`);
  return clienteSchema.parse(data);
}

export async function criarCliente(values: ClienteFormValues): Promise<Cliente> {
  const { data } = await http.post('/clientes', values);
  return clienteSchema.parse(data);
}

export async function atualizarCliente(
  id: string,
  values: Partial<ClienteFormValues>,
): Promise<Cliente> {
  const { data } = await http.patch(`/clientes/${id}`, values);
  return clienteSchema.parse(data);
}

export async function autorizarTransporte(clienteId: string, tipoTransporteId: string): Promise<Cliente> {
  const { data } = await http.post(`/clientes/${clienteId}/transportes`, { tipoTransporteId });
  return clienteSchema.parse(data);
}

export async function desautorizarTransporte(clienteId: string, tipoTransporteId: string): Promise<void> {
  await http.delete(`/clientes/${clienteId}/transportes/${tipoTransporteId}`);
}
