/** Parâmetros de paginação já normalizados. */
export interface Paginacao {
  page: number;
  limit: number;
}

/** Resultado paginado no nível do repositório (itens da página + total geral). */
export interface ResultadoPaginado<T> {
  itens: T[];
  total: number;
}

/** Envelope de resposta paginada da API. */
export interface Pagina<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_PADRAO = 1;
const LIMIT_PADRAO = 20;
const LIMIT_MAX = 100;

/** Normaliza page/limit com defaults e clamp (page ≥ 1; limit em [1, 100]). */
export function resolverPaginacao(page?: number, limit?: number): Paginacao {
  const p = Math.max(1, Math.trunc(Number(page) || PAGE_PADRAO));
  const l = Math.min(LIMIT_MAX, Math.max(1, Math.trunc(Number(limit) || LIMIT_PADRAO)));
  return { page: p, limit: l };
}

/** Offset (`skip`) para a página atual. */
export function paginaSkip(paginacao: Paginacao): number {
  return (paginacao.page - 1) * paginacao.limit;
}

/** Monta o envelope de resposta a partir dos itens da página e do total geral. */
export function montarPagina<T>(itens: T[], total: number, paginacao: Paginacao): Pagina<T> {
  return {
    data: itens,
    page: paginacao.page,
    limit: paginacao.limit,
    total,
    totalPages: Math.ceil(total / paginacao.limit) || 0,
  };
}
