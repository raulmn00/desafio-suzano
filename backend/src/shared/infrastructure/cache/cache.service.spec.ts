import { ConfigService } from '@nestjs/config';
import { FakeClock } from '../../testing/fakes';
import { CacheService, cacheTtlMs } from './cache.service';

describe('CacheService', () => {
  const t0 = new Date('2026-06-20T00:00:00.000Z');

  it('cache-aside: carrega na 1ª vez e serve do cache na 2ª (dentro do TTL)', async () => {
    const clock = new FakeClock(t0);
    const cache = new CacheService(clock);
    const carregar = jest.fn().mockResolvedValue(['a']);

    expect(await cache.obterOuCarregar('k', 1000, carregar)).toEqual(['a']);
    expect(await cache.obterOuCarregar('k', 1000, carregar)).toEqual(['a']);
    expect(carregar).toHaveBeenCalledTimes(1);
  });

  it('recarrega após o TTL expirar', async () => {
    const clock = new FakeClock(t0);
    const cache = new CacheService(clock);
    const carregar = jest.fn().mockResolvedValueOnce(['a']).mockResolvedValueOnce(['b']);

    await cache.obterOuCarregar('k', 1000, carregar);
    clock.definir(new Date(t0.getTime() + 1001));
    expect(await cache.obterOuCarregar('k', 1000, carregar)).toEqual(['b']);
    expect(carregar).toHaveBeenCalledTimes(2);
  });

  it('invalidar força recarregar na próxima leitura', async () => {
    const clock = new FakeClock(t0);
    const cache = new CacheService(clock);
    const carregar = jest.fn().mockResolvedValueOnce(['a']).mockResolvedValueOnce(['b']);

    await cache.obterOuCarregar('k', 1000, carregar);
    cache.invalidar('k');
    expect(await cache.obterOuCarregar('k', 1000, carregar)).toEqual(['b']);
    expect(carregar).toHaveBeenCalledTimes(2);
  });

  it('chaves distintas não colidem', async () => {
    const cache = new CacheService(new FakeClock(t0));
    await cache.obterOuCarregar('k1', 1000, jest.fn().mockResolvedValue(1));
    const carregar2 = jest.fn().mockResolvedValue(2);
    expect(await cache.obterOuCarregar('k2', 1000, carregar2)).toBe(2);
    expect(carregar2).toHaveBeenCalledTimes(1);
  });
});

describe('cacheTtlMs', () => {
  it('usa CACHE_TTL_MS quando definido', () => {
    expect(cacheTtlMs({ get: () => '5000' } as unknown as ConfigService)).toBe(5000);
  });

  it('usa 30000 como padrão', () => {
    expect(cacheTtlMs({ get: () => undefined } as unknown as ConfigService)).toBe(30000);
  });
});
