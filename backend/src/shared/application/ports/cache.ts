/**
 * Port de cache (chave→valor JSON, com TTL). Implementado por `InMemoryCache`
 * (dev/test) e `RedisCache` (produção), selecionados por `REDIS_URL`. Os valores
 * cacheados devem ser serializáveis (DTOs/views planas, nunca entidades).
 */
export abstract class Cache {
  abstract get<T>(chave: string): Promise<T | null>;
  abstract set<T>(chave: string, valor: T, ttlMs: number): Promise<void>;
  abstract del(chave: string): Promise<void>;
}
