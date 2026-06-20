import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { criarItem, listarItens } from './api';

const KEY = ['itens'];

export function useItens() {
  return useQuery({ queryKey: KEY, queryFn: listarItens });
}

export function useCriarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: criarItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
