import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  atualizarTipoTransporte,
  criarTipoTransporte,
  listarTiposTransporte,
} from './api';
import type { TipoTransporteFormValues } from './schema';

const KEY = ['tipos-transporte'];

export function useTiposTransporte() {
  return useQuery({ queryKey: KEY, queryFn: listarTiposTransporte });
}

export function useCriarTipoTransporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarTipoTransporte,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAtualizarTipoTransporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TipoTransporteFormValues> }) =>
      atualizarTipoTransporte(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
