/**
 * Marcador de evento de domínio. `nome` é a chave de roteamento usada pelo
 * publisher/handlers (ex.: 'ordem-venda.criada').
 */
export interface EventoDominio {
  readonly nome: string;
}
