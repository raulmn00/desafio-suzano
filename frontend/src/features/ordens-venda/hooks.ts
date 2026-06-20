import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  alterarTransporte,
  atualizarStatus,
  confirmarAgendamento,
  criarAgendamento,
  criarOrdem,
  listarOrdens,
  obterOrdem,
  reagendar,
  type FiltrosOrdem,
} from './api';
import type { AgendamentoFormValues, StatusOv } from './schema';

const ROOT = ['ordens-venda'];

export function useOrdens(filtros: FiltrosOrdem = {}) {
  return useQuery({
    queryKey: [...ROOT, 'list', filtros],
    queryFn: () => listarOrdens(filtros),
  });
}

export function useOrdem(id: string | undefined) {
  return useQuery({
    queryKey: [...ROOT, 'detail', id],
    queryFn: () => obterOrdem(id as string),
    enabled: Boolean(id),
  });
}

export function useCriarOrdem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarOrdem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  });
}

function useOvMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  });
}

export function useAtualizarStatus() {
  return useOvMutation(({ id, status }: { id: string; status: StatusOv }) =>
    atualizarStatus(id, status),
  );
}

export function useAlterarTransporte() {
  return useOvMutation(({ id, tipoTransporteId }: { id: string; tipoTransporteId: string }) =>
    alterarTransporte(id, tipoTransporteId),
  );
}

export function useCriarAgendamento() {
  return useOvMutation(({ id, values }: { id: string; values: AgendamentoFormValues }) =>
    criarAgendamento(id, values),
  );
}

export function useReagendar() {
  return useOvMutation(({ id, values }: { id: string; values: AgendamentoFormValues }) =>
    reagendar(id, values),
  );
}

export function useConfirmarAgendamento() {
  return useOvMutation(({ id }: { id: string }) => confirmarAgendamento(id));
}
