import { rotaDaRequisicao } from './rota-requisicao';

describe('rotaDaRequisicao', () => {
  it('combina baseUrl + padrão da rota (baixa cardinalidade, com :id)', () => {
    expect(rotaDaRequisicao({ baseUrl: '/api/v1', route: { path: '/clientes/:id' } })).toBe(
      '/api/v1/clientes/:id',
    );
  });

  it('funciona sem baseUrl (rotas fora do prefixo, ex. /health)', () => {
    expect(rotaDaRequisicao({ route: { path: '/health' } })).toBe('/health');
  });

  it('retorna "unmatched" quando não há rota casada (evita cardinalidade de 404)', () => {
    expect(rotaDaRequisicao({ baseUrl: '/api/v1' })).toBe('unmatched');
    expect(rotaDaRequisicao({})).toBe('unmatched');
  });
});
