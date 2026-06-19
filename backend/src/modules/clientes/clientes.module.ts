import { Module } from '@nestjs/common';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { TipoTransporteRepository } from '../tipos-transporte/domain/tipo-transporte.repository';
import { TiposTransporteModule } from '../tipos-transporte/tipos-transporte.module';
import { AutorizarTipoTransporteUseCase } from './application/use-cases/autorizar-tipo-transporte.use-case';
import { ConsultarClientePorIdUseCase } from './application/use-cases/consultar-cliente-por-id.use-case';
import { ConsultarClientesUseCase } from './application/use-cases/consultar-clientes.use-case';
import { CriarClienteUseCase } from './application/use-cases/criar-cliente.use-case';
import { DesautorizarTipoTransporteUseCase } from './application/use-cases/desautorizar-tipo-transporte.use-case';
import { EditarClienteUseCase } from './application/use-cases/editar-cliente.use-case';
import { ClienteRepository } from './domain/cliente.repository';
import { ClienteController } from './infrastructure/http/cliente.controller';
import { PrismaClienteRepository } from './infrastructure/persistence/prisma-cliente.repository';

@Module({
  imports: [TiposTransporteModule],
  controllers: [ClienteController],
  providers: [
    { provide: ClienteRepository, useClass: PrismaClienteRepository },
    {
      provide: CriarClienteUseCase,
      useFactory: (repo: ClienteRepository, ids: IdGenerator, clock: Clock) =>
        new CriarClienteUseCase(repo, ids, clock),
      inject: [ClienteRepository, IdGenerator, Clock],
    },
    {
      provide: EditarClienteUseCase,
      useFactory: (repo: ClienteRepository, clock: Clock) => new EditarClienteUseCase(repo, clock),
      inject: [ClienteRepository, Clock],
    },
    {
      provide: ConsultarClientesUseCase,
      useFactory: (repo: ClienteRepository) => new ConsultarClientesUseCase(repo),
      inject: [ClienteRepository],
    },
    {
      provide: ConsultarClientePorIdUseCase,
      useFactory: (repo: ClienteRepository) => new ConsultarClientePorIdUseCase(repo),
      inject: [ClienteRepository],
    },
    {
      provide: AutorizarTipoTransporteUseCase,
      useFactory: (repo: ClienteRepository, tipos: TipoTransporteRepository, clock: Clock) =>
        new AutorizarTipoTransporteUseCase(repo, tipos, clock),
      inject: [ClienteRepository, TipoTransporteRepository, Clock],
    },
    {
      provide: DesautorizarTipoTransporteUseCase,
      useFactory: (repo: ClienteRepository, clock: Clock) =>
        new DesautorizarTipoTransporteUseCase(repo, clock),
      inject: [ClienteRepository, Clock],
    },
  ],
  exports: [ClienteRepository],
})
export class ClientesModule {}
