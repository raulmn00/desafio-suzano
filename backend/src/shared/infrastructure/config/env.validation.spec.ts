import { validateEnv } from './env.validation';

const base = { JWT_SECRET: 'a'.repeat(40), DATABASE_URL: 'postgres://x' };

describe('validateEnv', () => {
  it('aceita um segredo forte em produção', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).not.toThrow();
  });

  it('retorna o config validado', () => {
    const cfg = { ...base, NODE_ENV: 'development' };
    expect(validateEnv(cfg)).toMatchObject(cfg);
  });

  it('exige JWT_SECRET mesmo fora de produção', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow(/JWT_SECRET/);
  });

  it('rejeita JWT_SECRET ausente em produção', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
  });

  it('rejeita em produção um segredo padrão/conhecido do repositório', () => {
    for (const fraco of [
      'dev-secret',
      'dev-secret-troque-em-producao',
      'troque-este-segredo-em-producao',
    ]) {
      expect(() => validateEnv({ ...base, JWT_SECRET: fraco, NODE_ENV: 'production' })).toThrow(
        /produção/i,
      );
    }
  });

  it('rejeita em produção um segredo curto (< 32 chars)', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'curtinho', NODE_ENV: 'production' })).toThrow(
      /32/,
    );
  });

  it('permite segredo curto/dev fora de produção (não quebra dev/test/CI)', () => {
    expect(() =>
      validateEnv({ ...base, JWT_SECRET: 'dev-secret', NODE_ENV: 'development' }),
    ).not.toThrow();
    expect(() => validateEnv({ ...base, JWT_SECRET: 'ci-secret', NODE_ENV: 'test' })).not.toThrow();
    expect(() => validateEnv({ ...base, JWT_SECRET: 'ci-secret' })).not.toThrow(); // NODE_ENV ausente
  });
});
