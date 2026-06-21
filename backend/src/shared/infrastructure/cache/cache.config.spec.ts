import { ConfigService } from '@nestjs/config';
import { FakeClock } from '../../testing/fakes';
import { cacheTtlMs, criarCache } from './cache.config';
import { InMemoryCache } from './in-memory-cache';
import { RedisCache } from './redis-cache';

const config = (valores: Record<string, string | undefined>): ConfigService =>
  ({ get: (chave: string) => valores[chave] }) as unknown as ConfigService;

describe('cacheTtlMs', () => {
  it('usa CACHE_TTL_MS quando definido', () => {
    expect(cacheTtlMs(config({ CACHE_TTL_MS: '5000' }))).toBe(5000);
  });

  it('usa 30000 como padrão', () => {
    expect(cacheTtlMs(config({}))).toBe(30000);
  });
});

describe('criarCache', () => {
  it('sem REDIS_URL → InMemoryCache', () => {
    expect(criarCache(config({}), new FakeClock())).toBeInstanceOf(InMemoryCache);
  });

  it('com REDIS_URL → RedisCache', () => {
    const cache = criarCache(config({ REDIS_URL: 'redis://localhost:6379' }), new FakeClock());
    expect(cache).toBeInstanceOf(RedisCache);
    (cache as RedisCache).desconectar(); // encerra o cliente lazy (evita handle aberto)
  });
});
