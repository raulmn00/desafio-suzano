import { Module } from '@nestjs/common';
import { AuditLogger } from '../../shared/application/ports/audit-logger';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { TransactionManager } from '../../shared/application/ports/transaction-manager';
import { ClienteRepository } from '../clientes/domain/cliente.repository';
import { ClientesModule } from '../clientes/clientes.module';
import { ItemRepository } from '../itens/domain/item.repository';
import { ItensModule } from '../itens/itens.module';
import { AlterarTransporteUseCase } from './application/use-cases/alterar-transporte.use-case';
import { AtualizarStatusUseCase } from './application/use-cases/atualizar-status.use-case';
import { ConfirmarAgendamentoUseCase } from './application/use-cases/confirmar-agendamento.use-case';
import { ConsultarOrdemPorIdUseCase } from './application/use-cases/consultar-ordem-por-id.use-case';
import { ConsultarOrdensUseCase } from './application/use-cases/consultar-ordens.use-case';
import { CriarOrdemVendaUseCase } from './application/use-cases/criar-ordem-venda.use-case';
import { DefinirAgendamentoUseCase } from './application/use-cases/definir-agendamento.use-case';
import { ReagendarUseCase } from './application/use-cases/reagendar.use-case';
import { OrdemVendaRepository } from './domain/ordem-venda.repository';
import { AgendamentoController } from './infrastructure/http/agendamento.controller';
import { OrdemVendaController } from './infrastructure/http/ordem-venda.controller';
import { PrismaOrdemVendaRepository } from './infrastructure/persistence/prisma-ordem-venda.repository';

@Module({
  imports: [ClientesModule, ItensModule],
  controllers: [OrdemVendaController, AgendamentoController],
  providers: [
    { provide: OrdemVendaRepository, useClass: PrismaOrdemVendaRepository },
    {
      provide: CriarOrdemVendaUseCase,
      useFactory: (
        ordens: OrdemVendaRepository,
        clientes: ClienteRepository,
        itens: ItemRepository,
        ids: IdGenerator,
        clock: Clock,
        audit: AuditLogger,
        tx: TransactionManager,
      ) => new CriarOrdemVendaUseCase(ordens, clientes, itens, ids, clock, audit, tx),
      inject: [
        OrdemVendaRepository,
        ClienteRepository,
        ItemRepository,
        IdGenerator,
        Clock,
        AuditLogger,
        TransactionManager,
      ],
    },
    {
      provide: ConsultarOrdensUseCase,
      useFactory: (repo: OrdemVendaRepository) => new ConsultarOrdensUseCase(repo),
      inject: [OrdemVendaRepository],
    },
    {
      provide: ConsultarOrdemPorIdUseCase,
      useFactory: (repo: OrdemVendaRepository) => new ConsultarOrdemPorIdUseCase(repo),
      inject: [OrdemVendaRepository],
    },
    {
      provide: AtualizarStatusUseCase,
      useFactory: (
        repo: OrdemVendaRepository,
        clock: Clock,
        audit: AuditLogger,
        tx: TransactionManager,
      ) => new AtualizarStatusUseCase(repo, clock, audit, tx),
      inject: [OrdemVendaRepository, Clock, AuditLogger, TransactionManager],
    },
    {
      provide: AlterarTransporteUseCase,
      useFactory: (
        ordens: OrdemVendaRepository,
        clientes: ClienteRepository,
        clock: Clock,
        audit: AuditLogger,
        tx: TransactionManager,
      ) => new AlterarTransporteUseCase(ordens, clientes, clock, audit, tx),
      inject: [OrdemVendaRepository, ClienteRepository, Clock, AuditLogger, TransactionManager],
    },
    {
      provide: DefinirAgendamentoUseCase,
      useFactory: (
        repo: OrdemVendaRepository,
        clock: Clock,
        audit: AuditLogger,
        tx: TransactionManager,
      ) => new DefinirAgendamentoUseCase(repo, clock, audit, tx),
      inject: [OrdemVendaRepository, Clock, AuditLogger, TransactionManager],
    },
    {
      provide: ConfirmarAgendamentoUseCase,
      useFactory: (
        repo: OrdemVendaRepository,
        clock: Clock,
        audit: AuditLogger,
        tx: TransactionManager,
      ) => new ConfirmarAgendamentoUseCase(repo, clock, audit, tx),
      inject: [OrdemVendaRepository, Clock, AuditLogger, TransactionManager],
    },
    {
      provide: ReagendarUseCase,
      useFactory: (
        repo: OrdemVendaRepository,
        clock: Clock,
        audit: AuditLogger,
        tx: TransactionManager,
      ) => new ReagendarUseCase(repo, clock, audit, tx),
      inject: [OrdemVendaRepository, Clock, AuditLogger, TransactionManager],
    },
  ],
  exports: [OrdemVendaRepository],
})
export class OrdensVendaModule {}
