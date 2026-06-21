import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLogger } from '../application/ports/audit-logger';
import { Cache } from '../application/ports/cache';
import { Clock } from '../application/ports/clock';
import { EventBus } from '../application/ports/event-bus';
import { EventPublisher } from '../application/ports/event-publisher';
import { IdGenerator } from '../application/ports/id-generator';
import { TransactionManager } from '../application/ports/transaction-manager';
import { SystemClock } from './adapters/system-clock';
import { UuidGenerator } from './adapters/uuid-generator';
import { criarCache } from './cache/cache.config';
import { criarEventBus } from './events/events.config';
import { OutboxEventPublisher } from './events/outbox-event-publisher';
import { OutboxRelay } from './events/outbox-relay';
import { RedisStreamConsumer } from './events/redis-stream-consumer';
import { PrismaAuditLogger } from './persistence/prisma-audit-logger';
import { PrismaService } from './persistence/prisma.service';
import { PrismaTransactionManager } from './persistence/prisma-transaction-manager';

/**
 * Kernel compartilhado, global. Faz a inversão de dependência das portas
 * (abstract class como token) para as implementações de infraestrutura.
 */
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: UuidGenerator },
    { provide: TransactionManager, useClass: PrismaTransactionManager },
    { provide: AuditLogger, useClass: PrismaAuditLogger },
    // Outbox transacional: publica gravando no outbox (EventPublisher) e entrega
    // depois via EventBus, orquestrado pelo OutboxRelay. O EventBus é Redis
    // Streams quando há REDIS_URL (distribuído) ou in-process (EventEmitter2).
    { provide: EventPublisher, useClass: OutboxEventPublisher },
    {
      provide: EventBus,
      useFactory: (config: ConfigService, emitter: EventEmitter2) => criarEventBus(config, emitter),
      inject: [ConfigService, EventEmitter2],
    },
    OutboxRelay,
    RedisStreamConsumer, // inerte sem REDIS_URL; consome o stream quando há
    {
      provide: Cache,
      useFactory: (config: ConfigService, clock: Clock) => criarCache(config, clock),
      inject: [ConfigService, Clock],
    },
  ],
  exports: [
    PrismaService,
    Clock,
    IdGenerator,
    TransactionManager,
    AuditLogger,
    EventPublisher,
    Cache,
  ],
})
export class SharedModule {}
