import { DomainValidationError } from '../../../shared/domain/domain-error';

interface TipoTransporteProps {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CriarTipoTransporteProps {
  id: string;
  nome: string;
  codigo: string;
  agora: Date;
}

export interface RestaurarTipoTransporteProps {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Modalidade de transporte (Caminhão, Carreta, Bi-truck, ...).
 *
 * Extensibilidade (open/closed): novos tipos são apenas novas instâncias —
 * nenhuma regra de negócio precisa mudar para suportá-los. O `codigo` é a chave
 * de negócio estável (normalizada em maiúsculas).
 */
export class TipoTransporte {
  private constructor(private props: TipoTransporteProps) {}

  static criar(props: CriarTipoTransporteProps): TipoTransporte {
    const nome = TipoTransporte.validarNome(props.nome);
    const codigo = TipoTransporte.normalizarCodigo(props.codigo);
    return new TipoTransporte({
      id: props.id,
      nome,
      codigo,
      ativo: true,
      criadoEm: props.agora,
      atualizadoEm: props.agora,
    });
  }

  static restaurar(props: RestaurarTipoTransporteProps): TipoTransporte {
    return new TipoTransporte({ ...props });
  }

  private static validarNome(nome: string): string {
    const limpo = nome.trim();
    if (limpo.length === 0) {
      throw new DomainValidationError('Nome do tipo de transporte é obrigatório.');
    }
    return limpo;
  }

  static normalizarCodigo(codigo: string): string {
    const limpo = codigo.trim().toUpperCase();
    if (limpo.length === 0) {
      throw new DomainValidationError('Código do tipo de transporte é obrigatório.');
    }
    return limpo;
  }

  editar(dados: { nome?: string; codigo?: string }, agora: Date): void {
    if (dados.nome !== undefined) {
      this.props.nome = TipoTransporte.validarNome(dados.nome);
    }
    if (dados.codigo !== undefined) {
      this.props.codigo = TipoTransporte.normalizarCodigo(dados.codigo);
    }
    this.props.atualizadoEm = agora;
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

  get codigo(): string {
    return this.props.codigo;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  get atualizadoEm(): Date {
    return this.props.atualizadoEm;
  }
}
