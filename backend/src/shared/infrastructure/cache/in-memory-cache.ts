import { Injectable } from '@nestjs/common';
import { Clock } from '../../application/ports/clock';
import { Cache } from '../../application/ports/cache';

interface Entrada {
  valor: unknown;
  expiraEm: number;
}

/**
 * Cache in-memory com TTL (por-instância). Default para dev/test/CI — não exige
 * Redis. Em produção distribuída, `RedisCache` assume via `REDIS_URL`.
 */
@Injectable()
export class InMemoryCache extends Cache {
  private readonly store = new Map<string, Entrada>();

  constructor(private readonly clock: Clock) {
    super();
  }

  async get<T>(chave: string): Promise<T | null> {
    const entrada = this.store.get(chave);
    if (!entrada || entrada.expiraEm <= this.clock.agora().getTime()) {
      if (entrada) this.store.delete(chave);
      return null;
    }
    return entrada.valor as T;
  }

  async set<T>(chave: string, valor: T, ttlMs: number): Promise<void> {
    this.store.set(chave, { valor, expiraEm: this.clock.agora().getTime() + ttlMs });
  }

  async del(chave: string): Promise<void> {
    this.store.delete(chave);
  }
}
