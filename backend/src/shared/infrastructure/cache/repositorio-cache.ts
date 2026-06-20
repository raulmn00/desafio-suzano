import { CacheService } from './cache.service';

/** Repositórios com uma leitura de lista cacheável e escrita única por `salvar`. */
export interface RepositorioListavel {
  listar(): Promise<unknown[]>;
  salvar(entidade: never): Promise<void>;
}

/**
 * Decora um repositório aplicando cache-aside na leitura `listar()` e
 * invalidação na escrita `salvar()`. Os demais métodos são delegados intactos.
 * Genérico (via Proxy) para evitar um decorator duplicado por catálogo.
 */
export function comCacheDeLista<R extends RepositorioListavel>(
  inner: R,
  cache: CacheService,
  chave: string,
  ttlMs: number,
): R {
  const handler: ProxyHandler<R> = {
    get(target, prop, receiver) {
      if (prop === 'listar') {
        return () => cache.obterOuCarregar(chave, ttlMs, () => target.listar());
      }
      if (prop === 'salvar') {
        return async (entidade: never): Promise<void> => {
          await target.salvar(entidade);
          cache.invalidar(chave);
        };
      }
      const valor = Reflect.get(target, prop, receiver) as unknown;
      if (typeof valor === 'function') {
        return (valor as (...args: unknown[]) => unknown).bind(target);
      }
      return valor;
    },
  };
  return new Proxy(inner, handler);
}
