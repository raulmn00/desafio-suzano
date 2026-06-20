import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { UnauthorizedError } from '../../../../shared/domain/domain-error';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { UsuarioRepository } from '../../domain/usuario.repository';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator';
import { TokenGenerator } from '../ports/token-generator';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

/**
 * Troca um refresh token válido por um novo par (access + refresh), rotacionando:
 * o refresh apresentado é revogado e um novo é emitido (single-use → detecção de
 * reuso). Revalida o usuário (existe e ativo) antes de emitir.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly tokenGenerator: TokenGenerator,
    private readonly opaqueTokenGenerator: OpaqueTokenGenerator,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly refreshTtlMs: number,
  ) {}

  async executar(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const registro = await this.refreshTokenRepository.buscarPorToken(input.refreshToken);
    if (!registro || registro.revogadoEm !== null) {
      throw new UnauthorizedError('Refresh token inválido, já utilizado ou revogado.');
    }
    if (registro.expiraEm.getTime() <= this.clock.agora().getTime()) {
      throw new UnauthorizedError('Refresh token expirado. Faça login novamente.');
    }

    const usuario = await this.usuarioRepository.buscarPorId(registro.usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError('Sessão inválida: usuário inexistente ou desativado.');
    }

    await this.refreshTokenRepository.revogar(registro.id);

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

    return { accessToken, refreshToken };
  }
}
