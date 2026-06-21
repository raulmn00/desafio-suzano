import { Logger } from '@nestjs/common';
import { EventBus } from '../../application/ports/event-bus';
import { EventoDominio } from '../../domain/evento-dominio';

/** Nome do stream de eventos de domínio no Redis. */
export const STREAM_EVENTOS = 'ovgs:eventos';

/** Subconjunto da API do ioredis usado pelo bus — facilita o teste com fake. */
export interface ClienteStreamPublisher {
  xadd(...args: (string | number)[]): Promise<string | null>;
}

/**
 * EventBus sobre Redis Streams (Fase 2): o relay publica aqui (`XADD`) e os
 * consumidores (`RedisStreamConsumer`, possivelmente em outras instâncias) leem
 * via consumer group. Entrega distribuída e durável no stream.
 */
export class RedisStreamEventBus extends EventBus {
  private readonly logger = new Logger(RedisStreamEventBus.name);

  constructor(private readonly client: ClienteStreamPublisher) {
    super();
  }

  async publicar(evento: EventoDominio): Promise<void> {
    // `data` carrega o evento serializado (inclui `id` do outbox p/ idempotência).
    await this.client.xadd(STREAM_EVENTOS, '*', 'data', JSON.stringify(evento));
    this.logger.debug?.(`XADD ${STREAM_EVENTOS} ${evento.nome}`);
  }
}
