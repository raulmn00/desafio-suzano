import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  atualizarCliente,
  autorizarTransporte,
  criarCliente,
  desautorizarTransporte,
  listarClientes,
} from './api';
import type { ClienteFormValues } from './schema';

const KEY = ['clientes'];

export function useClientes() {
  return useQuery({ queryKey: KEY, queryFn: listarClientes });
}

export function useCriarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarCliente,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAtualizarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ClienteFormValues> }) =>
      atualizarCliente(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAutorizarTransporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, tipoTransporteId }: { clienteId: string; tipoTransporteId: string }) =>
      autorizarTransporte(clienteId, tipoTransporteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDesautorizarTransporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, tipoTransporteId }: { clienteId: string; tipoTransporteId: string }) =>
      desautorizarTransporte(clienteId, tipoTransporteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
