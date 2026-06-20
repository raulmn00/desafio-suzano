interface RequisicaoComRota {
  baseUrl?: string;
  route?: { path?: string };
}

/**
 * Rótulo de rota para métricas: combina `baseUrl` + o **padrão** da rota casada
 * (ex.: `/api/v1/clientes/:id`), nunca a URL com ids reais — mantém a
 * cardinalidade das séries baixa. Sem rota casada (404) → `unmatched`.
 */
export function rotaDaRequisicao(req: RequisicaoComRota): string {
  const path = req.route?.path;
  if (!path) {
    return 'unmatched';
  }
  return `${req.baseUrl ?? ''}${path}`;
}
