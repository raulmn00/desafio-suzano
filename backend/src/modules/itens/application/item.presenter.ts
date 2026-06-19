import { Item } from '../domain/item.entity';

/** Forma de saída (view) de um item exposta pela aplicação. */
export interface ItemView {
  id: string;
  sku: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  criadoEm: string;
}

export function apresentarItem(item: Item): ItemView {
  return {
    id: item.id,
    sku: item.sku,
    descricao: item.descricao,
    unidade: item.unidade,
    ativo: item.ativo,
    criadoEm: item.criadoEm.toISOString(),
  };
}
