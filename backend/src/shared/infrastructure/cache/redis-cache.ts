import { Injectable, Logger } from '@nestjs/common';
import { Cache } from '../../application/ports/cache';

/** Subconjunto do ioredis usado pelo cache (facilita teste e desacoplamento). */
export interface ClienteRedis {
  get(chave: string): Promise<string | null>;
  set(chave: string, valor: string, modo: 'PX', ttlMs: number): Promise<unknown>;
  del(chave: string): Promise<unknown>;
  disconnect(): void;
}

/**
 * Cache distribuído sobre Redis (ioredis). Valores trafegam como JSON. Falhas do
 * Redis **degradam graciosamente**: leitura vira cache miss (busca no banco) e
 * escrita/invalidação apenas logam — o cache nunca derruba a requisição.
 */
@Injectable()
export class RedisCache extends Cache {
  private readonly logger = new Logger(RedisCache.name);

  constructor(private readonly client: ClienteRedis) {
    super();
  }

  async get<T>(chave: string): Promise<T | null> {
    try {
      const bruto = await this.client.get(chave);
      return bruto ? (JSON.parse(bruto) as T) : null;
    } catch (erro) {
      this.logger.warn(`Falha ao ler cache "${chave}": ${(erro as Error).message}`);
      return null;
    }
  }

  async set<T>(chave: string, valor: T, ttlMs: number): Promise<void> {
    try {
      await this.client.set(chave, JSON.stringify(valor), 'PX', ttlMs);
    } catch (erro) {
      this.logger.warn(`Falha ao gravar cache "${chave}": ${(erro as Error).message}`);
    }
  }

  async del(chave: string): Promise<void> {
    try {
      await this.client.del(chave);
    } catch (erro) {
      this.logger.warn(`Falha ao invalidar cache "${chave}": ${(erro as Error).message}`);
    }
  }

  desconectar(): void {
    this.client.disconnect();
  }
}
