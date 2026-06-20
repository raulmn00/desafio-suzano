import { EventoDominio } from '../../../../shared/domain/evento-dominio';
import { StatusOrdemVenda } from '../status-ordem-venda';

/** Disparado após uma Ordem de Venda ser criada (e persistida). */
export class OrdemVendaCriadaEvent implements EventoDominio {
  static readonly NOME = 'ordem-venda.criada';
  readonly nome = OrdemVendaCriadaEvent.NOME;

  constructor(
    readonly ordemId: string,
    readonly clienteId: string,
    readonly ator: string,
    readonly ocorridoEm: Date,
  ) {}
}

/** Disparado após uma transição de status válida (e persistida). */
export class OrdemVendaStatusAlteradoEvent implements EventoDominio {
  static readonly NOME = 'ordem-venda.status-alterado';
  readonly nome = OrdemVendaStatusAlteradoEvent.NOME;

  constructor(
    readonly ordemId: string,
    readonly de: StatusOrdemVenda,
    readonly para: StatusOrdemVenda,
    readonly ator: string,
    readonly ocorridoEm: Date,
  ) {}
}
