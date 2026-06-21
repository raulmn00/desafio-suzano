import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Cache } from '../../application/ports/cache';
import { Clock } from '../../application/ports/clock';
import { InMemoryCache } from './in-memory-cache';
import { RedisCache } from './redis-cache';

/** TTL de cache (ms) a partir do ambiente; padrão 30s. */
export function cacheTtlMs(config: ConfigService): number {
  return Number(config.get<string>('CACHE_TTL_MS') ?? '30000');
}

/**
 * Seleciona a implementação de cache: `RedisCache` quando `REDIS_URL` está
 * definido (cache distribuído), senão `InMemoryCache` (dev/test/CI). A conexão é
 * preguiçosa (`lazyConnect`) e tolerante a falha — não bloqueia o boot.
 */
export function criarCache(config: ConfigService, clock: Clock): Cache {
  const redisUrl = config.get<string>('REDIS_URL');
  if (!redisUrl) {
    return new InMemoryCache(clock);
  }
  const client = new Redis(redisUrl, {
    // lazyConnect: conecta no 1º comando (boot/teste não abrem conexão à toa).
    // A fila offline (default) segura esse 1º comando até o handshake; retries
    // limitados garantem que, se o Redis cair, o comando falha rápido e o cache
    // degrada para o banco (tratado no RedisCache) em vez de pendurar a request.
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });
  client.on('error', (erro) => new Logger('RedisCache').warn(`Redis: ${erro.message}`));
  return new RedisCache(client);
}
