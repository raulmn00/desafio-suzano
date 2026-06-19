import { Module } from '@nestjs/common';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { ConsultarTipoTransportePorIdUseCase } from './application/use-cases/consultar-tipo-transporte-por-id.use-case';
import { ConsultarTiposTransporteUseCase } from './application/use-cases/consultar-tipos-transporte.use-case';
import { CriarTipoTransporteUseCase } from './application/use-cases/criar-tipo-transporte.use-case';
import { EditarTipoTransporteUseCase } from './application/use-cases/editar-tipo-transporte.use-case';
import { TipoTransporteRepository } from './domain/tipo-transporte.repository';
import { TipoTransporteController } from './infrastructure/http/tipo-transporte.controller';
import { PrismaTipoTransporteRepository } from './infrastructure/persistence/prisma-tipo-transporte.repository';

@Module({
  controllers: [TipoTransporteController],
  providers: [
    { provide: TipoTransporteRepository, useClass: PrismaTipoTransporteRepository },
    {
      provide: CriarTipoTransporteUseCase,
      useFactory: (repo: TipoTransporteRepository, ids: IdGenerator, clock: Clock) =>
        new CriarTipoTransporteUseCase(repo, ids, clock),
      inject: [TipoTransporteRepository, IdGenerator, Clock],
    },
    {
      provide: EditarTipoTransporteUseCase,
      useFactory: (repo: TipoTransporteRepository, clock: Clock) =>
        new EditarTipoTransporteUseCase(repo, clock),
      inject: [TipoTransporteRepository, Clock],
    },
    {
      provide: ConsultarTiposTransporteUseCase,
      useFactory: (repo: TipoTransporteRepository) => new ConsultarTiposTransporteUseCase(repo),
      inject: [TipoTransporteRepository],
    },
    {
      provide: ConsultarTipoTransportePorIdUseCase,
      useFactory: (repo: TipoTransporteRepository) => new ConsultarTipoTransportePorIdUseCase(repo),
      inject: [TipoTransporteRepository],
    },
  ],
  exports: [TipoTransporteRepository],
})
export class TiposTransporteModule {}
