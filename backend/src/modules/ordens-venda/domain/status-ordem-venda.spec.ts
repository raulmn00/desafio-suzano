import { podeTransicionar, StatusOrdemVenda as S } from './status-ordem-venda';

describe('Máquina de estados da Ordem de Venda', () => {
  const transicoesValidas: Array<[S, S]> = [
    [S.CRIADA, S.PLANEJADA],
    [S.PLANEJADA, S.AGENDADA],
    [S.AGENDADA, S.EM_TRANSPORTE],
    [S.EM_TRANSPORTE, S.ENTREGUE],
  ];

  it.each(transicoesValidas)('permite %s → %s', (de, para) => {
    expect(podeTransicionar(de, para)).toBe(true);
  });

  // Matriz completa de transições INVÁLIDAS (todas as células fora da sequência).
  const todos = Object.values(S);
  const invalidas: Array<[S, S]> = [];
  for (const de of todos) {
    for (const para of todos) {
      if (!transicoesValidas.some(([d, p]) => d === de && p === para)) {
        invalidas.push([de, para]);
      }
    }
  }

  it.each(invalidas)('rejeita %s → %s', (de, para) => {
    expect(podeTransicionar(de, para)).toBe(false);
  });
});
