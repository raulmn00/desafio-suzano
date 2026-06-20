import { OrdemDeVenda } from './ordem-venda.entity';
import { StatusOrdemVenda } from './status-ordem-venda';

/** Filtros do monitoramento operacional (status, cliente, transporte, período). */
export interface FiltrosOrdemVenda {
  status?: StatusOrdemVenda;
  clienteId?: string;
  tipoTransporteId?: string;
  criadoDe?: Date;
  criadoAte?: Date;
}

export abstract class OrdemVendaRepository {
  abstract salvar(ordem: OrdemDeVenda): Promise<void>;
  abstract buscarPorId(id: string): Promise<OrdemDeVenda | null>;
  abstract listar(filtros: FiltrosOrdemVenda): Promise<OrdemDeVenda[]>;
  abstract existePorId(id: string): Promise<boolean>;
}
