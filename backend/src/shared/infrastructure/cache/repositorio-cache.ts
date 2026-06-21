import { Cache } from '../../application/ports/cache';

/** Repositórios com escrita única por `salvar` (gatilho de invalidação). */
export interface RepositorioComSalvar {
  salvar(entidade: never): Promise<void>;
}

/**
 * Decora um repositório invalidando a chave de cache do catálogo a cada escrita
 * (`salvar`). A leitura é cacheada no use-case (que devolve DTOs serializáveis);
 * aqui só garantimos que qualquer mutação derruba o cache — inclusive para todas
 * as instâncias, quando o cache é o Redis. Demais métodos passam intactos.
 */
export function comInvalidacaoDeCache<R extends RepositorioComSalvar>(
  inner: R,
  cache: Cache,
  chave: string,
): R {
  const handler: ProxyHandler<R> = {
    get(target, prop, receiver) {
      if (prop === 'salvar') {
        return async (entidade: never): Promise<void> => {
          await target.salvar(entidade);
          await cache.del(chave);
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
