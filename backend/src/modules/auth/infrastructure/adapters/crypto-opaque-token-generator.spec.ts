import { CryptoOpaqueTokenGenerator } from './crypto-opaque-token-generator';

describe('CryptoOpaqueTokenGenerator', () => {
  const gen = new CryptoOpaqueTokenGenerator();

  it('gera um token base64url longo', () => {
    const token = gen.gerar();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it('gera tokens distintos a cada chamada', () => {
    expect(gen.gerar()).not.toBe(gen.gerar());
  });
});
