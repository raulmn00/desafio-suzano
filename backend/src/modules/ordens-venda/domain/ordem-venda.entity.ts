import {
  AgendamentoInexistenteError,
  AgendamentoInvalidoError,
  AgendamentoNaoConfirmadoError,
  ItemDuplicadoNaOrdemError,
  OperacaoInvalidaParaStatusError,
  OrdemSemItensError,
  QuantidadeInvalidaError,
} from './ordem-venda.errors';
import {
  podeTransicionar,
  StatusOrdemVenda,
  TransicaoInvalidaError,
} from './status-ordem-venda';

export interface ItemDaOrdem {
  itemId: string;
  quantidade: number;
}

export interface Agendamento {
  dataEntrega: Date;
  janelaInicio: string;
  janelaFim: string;
  confirmado: boolean;
}

export interface DadosAgendamento {
  dataEntrega: Date;
  janelaInicio: string;
  janelaFim: string;
}

interface OrdemVendaProps {
  id: string;
  clienteId: string;
  tipoTransporteId: string;
  status: StatusOrdemVenda;
  itens: ItemDaOrdem[];
  agendamento: Agendamento | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CriarOrdemVendaProps {
  id: string;
  clienteId: string;
  tipoTransporteId: string;
  itens: ItemDaOrdem[];
  agora: Date;
}

export interface RestaurarOrdemVendaProps {
  id: string;
  clienteId: string;
  tipoTransporteId: string;
  status: StatusOrdemVenda;
  itens: ItemDaOrdem[];
  agendamento: Agendamento | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Ordem de Venda (aggregate root). Concentra as invariantes do ciclo de vida:
 * exige ao menos um item, garante apenas transições válidas de status e regula
 * o agendamento (só "AGENDADA" com agendamento confirmado). A regra de
 * transporte autorizado por cliente é orquestrada no use-case de criação, pois
 * depende do agregado Cliente.
 */
export class OrdemDeVenda {
  private constructor(private props: OrdemVendaProps) {}

  static criar(input: CriarOrdemVendaProps): OrdemDeVenda {
    OrdemDeVenda.validarItens(input.itens);
    return new OrdemDeVenda({
      id: input.id,
      clienteId: input.clienteId,
      tipoTransporteId: input.tipoTransporteId,
      status: StatusOrdemVenda.CRIADA,
      itens: input.itens.map((i) => ({ ...i })),
      agendamento: null,
      criadoEm: input.agora,
      atualizadoEm: input.agora,
    });
  }

  static restaurar(props: RestaurarOrdemVendaProps): OrdemDeVenda {
    return new OrdemDeVenda({
      ...props,
      itens: props.itens.map((i) => ({ ...i })),
      agendamento: props.agendamento ? { ...props.agendamento } : null,
    });
  }

  private static validarItens(itens: ItemDaOrdem[]): void {
    if (itens.length === 0) {
      throw new OrdemSemItensError();
    }
    const vistos = new Set<string>();
    for (const item of itens) {
      if (item.quantidade <= 0) {
        throw new QuantidadeInvalidaError(item.itemId);
      }
      if (vistos.has(item.itemId)) {
        throw new ItemDuplicadoNaOrdemError(item.itemId);
      }
      vistos.add(item.itemId);
    }
  }

  private static validarJanela(inicio: string, fim: string): void {
    if (!FORMATO_HORA.test(inicio) || !FORMATO_HORA.test(fim)) {
      throw new AgendamentoInvalidoError('A janela de atendimento deve estar no formato HH:mm.');
    }
    if (inicio >= fim) {
      throw new AgendamentoInvalidoError('A janela de atendimento deve ter início antes do fim.');
    }
  }

  private garantirAgendavel(operacao: string): void {
    const permitido =
      this.props.status === StatusOrdemVenda.PLANEJADA ||
      this.props.status === StatusOrdemVenda.AGENDADA;
    if (!permitido) {
      throw new OperacaoInvalidaParaStatusError(operacao, this.props.status);
    }
  }

  transicionarPara(novoStatus: StatusOrdemVenda, agora: Date): void {
    if (!podeTransicionar(this.props.status, novoStatus)) {
      throw new TransicaoInvalidaError(this.props.status, novoStatus);
    }
    if (novoStatus === StatusOrdemVenda.AGENDADA && !this.props.agendamento?.confirmado) {
      throw new AgendamentoNaoConfirmadoError();
    }
    this.props.status = novoStatus;
    this.props.atualizadoEm = agora;
  }

  definirAgendamento(dados: DadosAgendamento, agora: Date): void {
    this.garantirAgendavel('definir agendamento');
    OrdemDeVenda.validarJanela(dados.janelaInicio, dados.janelaFim);
    this.props.agendamento = {
      dataEntrega: dados.dataEntrega,
      janelaInicio: dados.janelaInicio,
      janelaFim: dados.janelaFim,
      confirmado: false,
    };
    this.props.atualizadoEm = agora;
  }

  confirmarAgendamento(agora: Date): void {
    if (!this.props.agendamento) {
      throw new AgendamentoInexistenteError();
    }
    this.props.agendamento = { ...this.props.agendamento, confirmado: true };
    this.props.atualizadoEm = agora;
  }

  reagendar(dados: DadosAgendamento, agora: Date): void {
    if (!this.props.agendamento) {
      throw new AgendamentoInexistenteError();
    }
    this.garantirAgendavel('reagendar');
    OrdemDeVenda.validarJanela(dados.janelaInicio, dados.janelaFim);
    this.props.agendamento = {
      dataEntrega: dados.dataEntrega,
      janelaInicio: dados.janelaInicio,
      janelaFim: dados.janelaFim,
      confirmado: false,
    };
    this.props.atualizadoEm = agora;
  }

  alterarTransporte(novoTipoTransporteId: string, agora: Date): void {
    const permitido =
      this.props.status === StatusOrdemVenda.CRIADA ||
      this.props.status === StatusOrdemVenda.PLANEJADA;
    if (!permitido) {
      throw new OperacaoInvalidaParaStatusError('alterar transporte', this.props.status);
    }
    this.props.tipoTransporteId = novoTipoTransporteId;
    this.props.atualizadoEm = agora;
  }

  get id(): string {
    return this.props.id;
  }

  get clienteId(): string {
    return this.props.clienteId;
  }

  get tipoTransporteId(): string {
    return this.props.tipoTransporteId;
  }

  get status(): StatusOrdemVenda {
    return this.props.status;
  }

  get itens(): ItemDaOrdem[] {
    return this.props.itens.map((i) => ({ ...i }));
  }

  get agendamento(): Agendamento | null {
    return this.props.agendamento ? { ...this.props.agendamento } : null;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  get atualizadoEm(): Date {
    return this.props.atualizadoEm;
  }
}
