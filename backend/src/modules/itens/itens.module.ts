import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from '../../shared/application/ports/cache';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { cacheTtlMs } from '../../shared/infrastructure/cache/cache.config';
import { comInvalidacaoDeCache } from '../../shared/infrastructure/cache/repositorio-cache';
import { PrismaService } from '../../shared/infrastructure/persistence/prisma.service';
import { ConsultarItemPorIdUseCase } from './application/use-cases/consultar-item-por-id.use-case';
import {
  CHAVE_CACHE_ITENS,
  ConsultarItensUseCase,
} from './application/use-cases/consultar-itens.use-case';
import { CriarItemUseCase } from './application/use-cases/criar-item.use-case';
import { ItemRepository } from './domain/item.repository';
import { ItemController } from './infrastructure/http/item.controller';
import { PrismaItemRepository } from './infrastructure/persistence/prisma-item.repository';

@Module({
  controllers: [ItemController],
  providers: [
    {
      provide: ItemRepository,
      useFactory: (prisma: PrismaService, cache: Cache) =>
        comInvalidacaoDeCache(new PrismaItemRepository(prisma), cache, CHAVE_CACHE_ITENS),
      inject: [PrismaService, Cache],
    },
    {
      provide: CriarItemUseCase,
      useFactory: (repo: ItemRepository, ids: IdGenerator, clock: Clock) =>
        new CriarItemUseCase(repo, ids, clock),
      inject: [ItemRepository, IdGenerator, Clock],
    },
    {
      provide: ConsultarItensUseCase,
      useFactory: (repo: ItemRepository, cache: Cache, config: ConfigService) =>
        new ConsultarItensUseCase(repo, cache, cacheTtlMs(config)),
      inject: [ItemRepository, Cache, ConfigService],
    },
    {
      provide: ConsultarItemPorIdUseCase,
      useFactory: (repo: ItemRepository) => new ConsultarItemPorIdUseCase(repo),
      inject: [ItemRepository],
    },
  ],
  exports: [ItemRepository],
})
export class ItensModule {}
