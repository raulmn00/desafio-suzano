import { FakeClock } from '../../testing/fakes';
import { InMemoryCache } from './in-memory-cache';

const t0 = new Date('2026-06-20T00:00:00.000Z');

describe('InMemoryCache', () => {
  it('set/get devolve o valor dentro do TTL', async () => {
    const cache = new InMemoryCache(new FakeClock(t0));
    await cache.set('k', [1, 2], 1000);
    expect(await cache.get<number[]>('k')).toEqual([1, 2]);
  });

  it('get devolve null para chave inexistente', async () => {
    expect(await new InMemoryCache(new FakeClock(t0)).get('x')).toBeNull();
  });

  it('expira após o TTL', async () => {
    const clock = new FakeClock(t0);
    const cache = new InMemoryCache(clock);
    await cache.set('k', 'v', 1000);
    clock.definir(new Date(t0.getTime() + 1001));
    expect(await cache.get('k')).toBeNull();
  });

  it('del remove a chave', async () => {
    const cache = new InMemoryCache(new FakeClock(t0));
    await cache.set('k', 'v', 1000);
    await cache.del('k');
    expect(await cache.get('k')).toBeNull();
  });
});
