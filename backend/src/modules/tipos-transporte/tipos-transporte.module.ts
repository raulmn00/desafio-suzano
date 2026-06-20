import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { CacheService, cacheTtlMs } from '../../shared/infrastructure/cache/cache.service';
import { comCacheDeLista } from '../../shared/infrastructure/cache/repositorio-cache';
import { PrismaService } from '../../shared/infrastructure/persistence/prisma.service';
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
    {
      provide: TipoTransporteRepository,
      useFactory: (prisma: PrismaService, cache: CacheService, config: ConfigService) =>
        comCacheDeLista(
          new PrismaTipoTransporteRepository(prisma),
          cache,
          'tipos-transporte:lista',
          cacheTtlMs(config),
        ),
      inject: [PrismaService, CacheService, ConfigService],
    },
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
