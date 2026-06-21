import { montarPagina, paginaSkip, resolverPaginacao } from './pagination';

describe('resolverPaginacao', () => {
  it('aplica defaults (page=1, limit=20) quando ausentes', () => {
    expect(resolverPaginacao()).toEqual({ page: 1, limit: 20 });
  });

  it('respeita valores válidos', () => {
    expect(resolverPaginacao(3, 50)).toEqual({ page: 3, limit: 50 });
  });

  it('faz clamp: page mínima 1, limit em [1, 100]', () => {
    expect(resolverPaginacao(0, 0)).toEqual({ page: 1, limit: 20 });
    expect(resolverPaginacao(-5, 999)).toEqual({ page: 1, limit: 100 });
  });
});

describe('paginaSkip', () => {
  it('calcula o offset', () => {
    expect(paginaSkip({ page: 1, limit: 20 })).toBe(0);
    expect(paginaSkip({ page: 3, limit: 20 })).toBe(40);
  });
});

describe('montarPagina', () => {
  it('monta o envelope com totalPages', () => {
    expect(montarPagina(['a', 'b'], 5, { page: 1, limit: 2 })).toEqual({
      data: ['a', 'b'],
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it('totalPages = 0 quando não há resultados', () => {
    expect(montarPagina([], 0, { page: 1, limit: 20 })).toMatchObject({ total: 0, totalPages: 0 });
  });
});
