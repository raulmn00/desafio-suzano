import { PapelUsuario } from '../../domain/papel-usuario';
import { CredenciaisInvalidasError } from '../../domain/auth.errors';
import { UsuarioRepository } from '../../domain/usuario.repository';
import { HashComparer } from '../ports/hash-comparer';
import { TokenGenerator } from '../ports/token-generator';

export interface LoginInput {
  email: string;
  senha: string;
}

export interface LoginOutput {
  accessToken: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    papel: PapelUsuario;
  };
}

export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly hashComparer: HashComparer,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async executar(input: LoginInput): Promise<LoginOutput> {
    const usuario = await this.usuarioRepository.buscarPorEmail(input.email);
    if (!usuario || !usuario.ativo) {
      throw new CredenciaisInvalidasError();
    }

    const senhaConfere = await this.hashComparer.comparar(input.senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw new CredenciaisInvalidasError();
    }

    const accessToken = this.tokenGenerator.gerar({
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        papel: usuario.papel,
      },
    };
  }
}
