import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { PapelUsuario } from '../../domain/papel-usuario';
import { CredenciaisInvalidasError } from '../../domain/auth.errors';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { UsuarioRepository } from '../../domain/usuario.repository';
import { HashComparer } from '../ports/hash-comparer';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator';
import { TokenGenerator } from '../ports/token-generator';

export interface LoginInput {
  email: string;
  senha: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
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
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly opaqueTokenGenerator: OpaqueTokenGenerator,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly refreshTtlMs: number,
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
      jti: this.idGenerator.gerar(),
    });

    const refreshToken = this.opaqueTokenGenerator.gerar();
    await this.refreshTokenRepository.emitir({
      id: this.idGenerator.gerar(),
      usuarioId: usuario.id,
      rawToken: refreshToken,
      expiraEm: new Date(this.clock.agora().getTime() + this.refreshTtlMs),
    });

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        papel: usuario.papel,
      },
    };
  }
}
