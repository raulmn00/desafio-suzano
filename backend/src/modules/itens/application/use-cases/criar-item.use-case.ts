import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { Item } from '../../domain/item.entity';
import { SkuJaCadastradoError } from '../../domain/item.errors';
import { ItemRepository } from '../../domain/item.repository';
import { apresentarItem, ItemView } from '../item.presenter';

export interface CriarItemInput {
  sku: string;
  descricao: string;
  unidade: string;
}

export class CriarItemUseCase {
  constructor(
    private readonly repositorio: ItemRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async executar(input: CriarItemInput): Promise<ItemView> {
    const item = Item.criar({
      id: this.idGenerator.gerar(),
      sku: input.sku,
      descricao: input.descricao,
      unidade: input.unidade,
      agora: this.clock.agora(),
    });

    const existente = await this.repositorio.buscarPorSku(item.sku);
    if (existente) {
      throw new SkuJaCadastradoError(item.sku);
    }

    await this.repositorio.salvar(item);
    return apresentarItem(item);
  }
}
