import { z } from 'zod';

/** Parâmetros de paginação enviados à API. */
export interface ParamsPaginacao {
  page?: number;
  limit?: number;
}

/** Envelope de resposta paginada da API. */
export interface Pagina<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Schema zod genérico do envelope paginado para um tipo de item. */
export function paginaSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  });
}

/** Converte os params de paginação em query string (apenas os definidos). */
export function paramsPaginacaoQuery(paginacao: ParamsPaginacao): Record<string, string> {
  const out: Record<string, string> = {};
  if (paginacao.page !== undefined) out.page = String(paginacao.page);
  if (paginacao.limit !== undefined) out.limit = String(paginacao.limit);
  return out;
}
