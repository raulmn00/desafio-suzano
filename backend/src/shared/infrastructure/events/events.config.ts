import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { EventBus } from '../../application/ports/event-bus';
import { InProcessEventBus } from './in-process-event-bus';
import { ClienteStreamPublisher, RedisStreamEventBus } from './redis-stream-event-bus';

/**
 * Seleciona o transporte de eventos: `RedisStreamEventBus` quando `REDIS_URL`
 * está definido (entrega distribuída via Redis Streams, entre instâncias), senão
 * `InProcessEventBus` (EventEmitter2, mesmo processo). Espelha a seleção do cache.
 */
export function criarEventBus(config: ConfigService, emitter: EventEmitter2): EventBus {
  const redisUrl = config.get<string>('REDIS_URL');
  if (!redisUrl) {
    return new InProcessEventBus(emitter);
  }
  // Conexão de publicação (XADD não-bloqueante): preguiçosa e com poucos retries.
  const client = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });
  client.on('error', (erro) =>
    new Logger('RedisStreamEventBus').warn(`Redis(stream): ${erro.message}`),
  );
  return new RedisStreamEventBus(client as unknown as ClienteStreamPublisher);
}
