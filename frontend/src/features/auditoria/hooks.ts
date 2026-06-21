import { useQuery } from '@tanstack/react-query';
import type { ParamsPaginacao } from '../../lib/pagination';
import { listarAuditoria, type FiltrosAuditoria } from './api';

export function useAuditoria(filtros: FiltrosAuditoria = {}, paginacao: ParamsPaginacao = {}) {
  return useQuery({
    queryKey: ['auditoria', filtros, paginacao],
    queryFn: () => listarAuditoria(filtros, paginacao),
  });
}
