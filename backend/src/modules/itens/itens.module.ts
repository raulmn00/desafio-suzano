import { Module } from '@nestjs/common';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { ConsultarItemPorIdUseCase } from './application/use-cases/consultar-item-por-id.use-case';
import { ConsultarItensUseCase } from './application/use-cases/consultar-itens.use-case';
import { CriarItemUseCase } from './application/use-cases/criar-item.use-case';
import { ItemRepository } from './domain/item.repository';
import { ItemController } from './infrastructure/http/item.controller';
import { PrismaItemRepository } from './infrastructure/persistence/prisma-item.repository';

@Module({
  controllers: [ItemController],
  providers: [
    { provide: ItemRepository, useClass: PrismaItemRepository },
    {
      provide: CriarItemUseCase,
      useFactory: (repo: ItemRepository, ids: IdGenerator, clock: Clock) =>
        new CriarItemUseCase(repo, ids, clock),
      inject: [ItemRepository, IdGenerator, Clock],
    },
    {
      provide: ConsultarItensUseCase,
      useFactory: (repo: ItemRepository) => new ConsultarItensUseCase(repo),
      inject: [ItemRepository],
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
