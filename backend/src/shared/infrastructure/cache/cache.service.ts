import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../../application/ports/clock';

interface Entrada {
  valor: unknown;
  expiraEm: number;
}

/**
 * Cache-aside in-memory com TTL. Por-instância (não compartilhado entre
 * instâncias) — adequado para catálogos lidos com frequência e que mudam pouco.
 * Em produção distribuída, trocar por Redis/Upstash mantendo a mesma interface.
 */
@Injectable()
export class CacheService {
  private readonly store = new Map<string, Entrada>();

  constructor(private readonly clock: Clock) {}

  async obterOuCarregar<T>(chave: string, ttlMs: number, carregar: () => Promise<T>): Promise<T> {
    const agora = this.clock.agora().getTime();
    const entrada = this.store.get(chave);
    if (entrada && entrada.expiraEm > agora) {
      return entrada.valor as T;
    }
    const valor = await carregar();
    this.store.set(chave, { valor, expiraEm: agora + ttlMs });
    return valor;
  }

  invalidar(chave: string): void {
    this.store.delete(chave);
  }
}

/** TTL de cache (ms) a partir do ambiente; padrão 30s. */
export function cacheTtlMs(config: ConfigService): number {
  return Number(config.get<string>('CACHE_TTL_MS') ?? '30000');
}
