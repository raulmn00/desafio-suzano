import { FakeClock } from '../../testing/fakes';
import { InMemoryCache } from './in-memory-cache';
import { comInvalidacaoDeCache } from './repositorio-cache';

interface RepoFake {
  salvar(e: string): Promise<void>;
  listar(): Promise<string[]>;
  buscarPorId(id: string): Promise<string | null>;
}

function repoFake(): jest.Mocked<RepoFake> {
  return {
    salvar: jest.fn().mockResolvedValue(undefined),
    listar: jest.fn().mockResolvedValue(['x']),
    buscarPorId: jest.fn().mockResolvedValue('achado'),
  };
}

describe('comInvalidacaoDeCache', () => {
  it('salvar() escreve no repo e invalida a chave de cache', async () => {
    const inner = repoFake();
    const cache = new InMemoryCache(new FakeClock());
    await cache.set('cat:lista', ['stale'], 10_000);
    const repo = comInvalidacaoDeCache(inner, cache, 'cat:lista');

    await repo.salvar('novo');

    expect(inner.salvar).toHaveBeenCalledWith('novo');
    expect(await cache.get('cat:lista')).toBeNull();
  });

  it('delega leituras (e demais métodos) ao repo interno', async () => {
    const inner = repoFake();
    const repo = comInvalidacaoDeCache(inner, new InMemoryCache(new FakeClock()), 'cat:lista');

    await expect(repo.listar()).resolves.toEqual(['x']);
    await expect(repo.buscarPorId('1')).resolves.toBe('achado');
    expect(inner.buscarPorId).toHaveBeenCalledWith('1');
  });

  it('delega propriedades não-função intactas', () => {
    const inner = { ...repoFake(), versao: 'v1' };
    const repo = comInvalidacaoDeCache(inner, new InMemoryCache(new FakeClock()), 'cat:lista') as {
      versao: string;
    };
    expect(repo.versao).toBe('v1');
  });
});
