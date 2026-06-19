import { DomainValidationError } from '../../../shared/domain/domain-error';

interface ItemProps {
  id: string;
  sku: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  criadoEm: Date;
}

export interface CriarItemProps {
  id: string;
  sku: string;
  descricao: string;
  unidade: string;
  agora: Date;
}

export interface RestaurarItemProps {
  id: string;
  sku: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  criadoEm: Date;
}

/**
 * Item pré-cadastrado do catálogo (produto que compõe uma ordem de venda).
 *
 * Itens são apenas criados e consultados — não há edição (regra do desafio). O
 * `sku` é a chave de negócio estável e única (normalizada em maiúsculas).
 */
export class Item {
  private constructor(private props: ItemProps) {}

  static criar(props: CriarItemProps): Item {
    const sku = Item.normalizarSku(props.sku);
    const descricao = Item.validarDescricao(props.descricao);
    const unidade = Item.validarUnidade(props.unidade);
    return new Item({
      id: props.id,
      sku,
      descricao,
      unidade,
      ativo: true,
      criadoEm: props.agora,
    });
  }

  static restaurar(props: RestaurarItemProps): Item {
    return new Item({ ...props });
  }

  private static validarDescricao(descricao: string): string {
    const limpo = descricao.trim();
    if (limpo.length === 0) {
      throw new DomainValidationError('Descrição do item é obrigatória.');
    }
    return limpo;
  }

  private static validarUnidade(unidade: string): string {
    const limpo = unidade.trim();
    if (limpo.length === 0) {
      throw new DomainValidationError('Unidade do item é obrigatória.');
    }
    return limpo;
  }

  static normalizarSku(sku: string): string {
    const limpo = sku.trim().toUpperCase();
    if (limpo.length === 0) {
      throw new DomainValidationError('SKU do item é obrigatório.');
    }
    return limpo;
  }

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get unidade(): string {
    return this.props.unidade;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }
}
