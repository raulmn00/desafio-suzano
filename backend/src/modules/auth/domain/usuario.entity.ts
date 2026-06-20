import { PapelUsuario } from './papel-usuario';

export interface UsuarioProps {
  id: string;
  email: string;
  nome: string;
  senhaHash: string;
  papel: PapelUsuario;
  ativo: boolean;
}

/**
 * Usuário do sistema (RBAC). A senha nunca trafega/armazena em texto — apenas o
 * hash. A comparação acontece no use-case via o port `HashComparer`.
 */
export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  static restaurar(props: UsuarioProps): Usuario {
    return new Usuario(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get nome(): string {
    return this.props.nome;
  }

  get senhaHash(): string {
    return this.props.senhaHash;
  }

  get papel(): PapelUsuario {
    return this.props.papel;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }
}
