import { useQuery } from '@tanstack/react-query';
import { listarAuditoria, type FiltrosAuditoria } from './api';

export function useAuditoria(filtros: FiltrosAuditoria = {}) {
  return useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => listarAuditoria(filtros),
  });
}
