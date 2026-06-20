import { Module } from '@nestjs/common';
import { ConsultarAuditoriaUseCase } from './application/use-cases/consultar-auditoria.use-case';
import { AuditEventRepository } from './domain/audit-event.repository';
import { AuditoriaController } from './infrastructure/http/auditoria.controller';
import { PrismaAuditEventRepository } from './infrastructure/persistence/prisma-audit-event.repository';

@Module({
  controllers: [AuditoriaController],
  providers: [
    { provide: AuditEventRepository, useClass: PrismaAuditEventRepository },
    {
      provide: ConsultarAuditoriaUseCase,
      useFactory: (repo: AuditEventRepository) => new ConsultarAuditoriaUseCase(repo),
      inject: [AuditEventRepository],
    },
  ],
})
export class AuditoriaModule {}
