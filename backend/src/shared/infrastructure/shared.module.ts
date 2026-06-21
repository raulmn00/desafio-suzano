import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { InProcessEventBus } from './events/in-process-event-bus';
import { OutboxEventPublisher } from './events/outbox-event-publisher';
import { OutboxRelay } from './events/outbox-relay';
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
    // depois via EventBus (in-process na Fase 1), orquestrado pelo OutboxRelay.
    { provide: EventPublisher, useClass: OutboxEventPublisher },
    { provide: EventBus, useClass: InProcessEventBus },
    OutboxRelay,
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
