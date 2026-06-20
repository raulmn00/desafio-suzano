import { AccessTokenDenylistRepository } from '../../domain/access-token-denylist.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';

export interface LogoutInput {
  /** Refresh token a invalidar (opcional — encerra a sessão para sempre). */
  refreshToken?: string;
  /** jti do access token atual (vai para a denylist até expirar). */
  jti: string;
  /** Expiração do access token atual (limpeza futura da denylist). */
  accessExpiraEm: Date;
}

/**
 * Encerra a sessão atual: coloca o access token (por `jti`) na denylist para
 * revogação imediata e revoga o refresh token apresentado (impede renovação).
 */
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenDenylistRepository: AccessTokenDenylistRepository,
  ) {}

  async executar(input: LogoutInput): Promise<void> {
    if (input.refreshToken) {
      const registro = await this.refreshTokenRepository.buscarPorToken(input.refreshToken);
      if (registro && registro.revogadoEm === null) {
        await this.refreshTokenRepository.revogar(registro.id);
      }
    }
    await this.accessTokenDenylistRepository.revogar(input.jti, input.accessExpiraEm);
  }
}
