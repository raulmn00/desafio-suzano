import { Global, Module } from '@nestjs/common';
import { AuditLogger } from '../application/ports/audit-logger';
import { Clock } from '../application/ports/clock';
import { IdGenerator } from '../application/ports/id-generator';
import { TransactionManager } from '../application/ports/transaction-manager';
import { SystemClock } from './adapters/system-clock';
import { UuidGenerator } from './adapters/uuid-generator';
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
  ],
  exports: [PrismaService, Clock, IdGenerator, TransactionManager, AuditLogger],
})
export class SharedModule {}
