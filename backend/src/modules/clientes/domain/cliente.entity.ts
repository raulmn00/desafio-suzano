import { DomainValidationError } from '../../../shared/domain/domain-error';
import { Documento } from './documento.vo';

interface ClienteProps {
  id: string;
  nome: string;
  documento: Documento;
  ativo: boolean;
  transportesAutorizados: string[];
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CriarClienteProps {
  id: string;
  nome: string;
  documento: string;
  agora: Date;
}

export interface RestaurarClienteProps {
  id: string;
  nome: string;
  documento: string;
  ativo: boolean;
  transportesAutorizados: string[];
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Cliente (aggregate root). Mantém a lista de tipos de transporte autorizados —
 * regra de negócio central: uma Ordem de Venda só pode usar um transporte que
 * esteja autorizado para o cliente. A consulta a essa autorização vive aqui,
 * no domínio, e não espalhada por queries.
 */
export class Cliente {
  private constructor(private props: ClienteProps) {}

  static criar(input: CriarClienteProps): Cliente {
    return new Cliente({
      id: input.id,
      nome: Cliente.validarNome(input.nome),
      documento: Documento.criar(input.documento),
      ativo: true,
      transportesAutorizados: [],
      criadoEm: input.agora,
      atualizadoEm: input.agora,
    });
  }

  static restaurar(props: RestaurarClienteProps): Cliente {
    return new Cliente({
      ...props,
      documento: Documento.restaurar(props.documento),
      transportesAutorizados: [...new Set(props.transportesAutorizados)],
    });
  }

  private static validarNome(nome: string): string {
    const limpo = nome.trim();
    if (limpo.length === 0) {
      throw new DomainValidationError('Nome do cliente é obrigatório.');
    }
    return limpo;
  }

  editar(dados: { nome?: string; documento?: string }, agora: Date): void {
    if (dados.nome !== undefined) {
      this.props.nome = Cliente.validarNome(dados.nome);
    }
    if (dados.documento !== undefined) {
      this.props.documento = Documento.criar(dados.documento);
    }
    this.props.atualizadoEm = agora;
  }

  autorizarTransporte(tipoTransporteId: string, agora: Date): void {
    if (!this.props.transportesAutorizados.includes(tipoTransporteId)) {
      this.props.transportesAutorizados.push(tipoTransporteId);
      this.props.atualizadoEm = agora;
    }
  }

  desautorizarTransporte(tipoTransporteId: string, agora: Date): void {
    const antes = this.props.transportesAutorizados.length;
    this.props.transportesAutorizados = this.props.transportesAutorizados.filter(
      (id) => id !== tipoTransporteId,
    );
    if (this.props.transportesAutorizados.length !== antes) {
      this.props.atualizadoEm = agora;
    }
  }

  transporteEstaAutorizado(tipoTransporteId: string): boolean {
    return this.props.transportesAutorizados.includes(tipoTransporteId);
  }

  inativar(agora: Date): void {
    this.props.ativo = false;
    this.props.atualizadoEm = agora;
  }

  ativar(agora: Date): void {
    this.props.ativo = true;
    this.props.atualizadoEm = agora;
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get documento(): Documento {
    return this.props.documento;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get transportesAutorizados(): readonly string[] {
    return [...this.props.transportesAutorizados];
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  get atualizadoEm(): Date {
    return this.props.atualizadoEm;
  }
}
