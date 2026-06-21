/** Envelope paginado para mocks de teste (espelha o formato da API). */
export function pagina<T>(data: T[], limit = 20): { data: T[]; page: number; limit: number; total: number; totalPages: number } {
  return { data, page: 1, limit, total: data.length, totalPages: Math.ceil(data.length / limit) };
}
