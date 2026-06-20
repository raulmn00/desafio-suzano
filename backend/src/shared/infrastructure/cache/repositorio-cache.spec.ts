import { FakeClock } from '../../testing/fakes';
import { CacheService } from './cache.service';
import { comCacheDeLista } from './repositorio-cache';

interface RepoFake {
  listar(): Promise<string[]>;
  salvar(e: string): Promise<void>;
  buscarPorId(id: string): Promise<string | null>;
}

function repoFake(): jest.Mocked<RepoFake> {
  return {
    listar: jest.fn().mockResolvedValue(['x']),
    salvar: jest.fn().mockResolvedValue(undefined),
    buscarPorId: jest.fn().mockResolvedValue('achado'),
  };
}

describe('comCacheDeLista', () => {
  it('cacheia listar() — 2ª chamada não toca o repo interno', async () => {
    const inner = repoFake();
    const repo = comCacheDeLista(inner, new CacheService(new FakeClock()), 'cat:lista', 1000);

    await repo.listar();
    await repo.listar();
    expect(inner.listar).toHaveBeenCalledTimes(1);
  });

  it('salvar() invalida o cache da lista (próxima listar recarrega)', async () => {
    const inner = repoFake();
    const repo = comCacheDeLista(inner, new CacheService(new FakeClock()), 'cat:lista', 1000);

    await repo.listar();
    await repo.salvar('novo');
    await repo.listar();
    expect(inner.salvar).toHaveBeenCalledWith('novo');
    expect(inner.listar).toHaveBeenCalledTimes(2);
  });

  it('delega métodos não-cacheados ao repo interno', async () => {
    const inner = repoFake();
    const repo = comCacheDeLista(inner, new CacheService(new FakeClock()), 'cat:lista', 1000);

    await expect(repo.buscarPorId('1')).resolves.toBe('achado');
    expect(inner.buscarPorId).toHaveBeenCalledWith('1');
  });

  it('delega propriedades não-função (não-método) intactas', () => {
    const inner = { ...repoFake(), versao: 'v1' };
    const repo = comCacheDeLista(inner, new CacheService(new FakeClock()), 'cat:lista', 1000) as {
      versao: string;
    };
    expect(repo.versao).toBe('v1');
  });
});
