import { EventoDominio } from '../../domain/evento-dominio';

/**
 * Transporte de eventos de domínio JÁ persistidos — usado pelo `OutboxRelay`
 * para entregar os eventos do outbox aos consumidores.
 *
 * Fase 1: `InProcessEventBus` (EventEmitter2, mesmo processo).
 * Fase 2: `RedisStreamEventBus` (Redis Streams, entre instâncias).
 *
 * Separa "publicar no outbox" (EventPublisher, dentro da transação) de
 * "entregar o evento" (EventBus, após o commit) — o coração do padrão outbox.
 */
export abstract class EventBus {
  abstract publicar(evento: EventoDominio): Promise<void>;
}
