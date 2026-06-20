import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UnauthorizedError } from '../../../shared/domain/domain-error';
import { PayloadToken } from '../application/ports/token-generator';
import { AccessTokenDenylistRepository } from '../domain/access-token-denylist.repository';
import { PapelUsuario } from '../domain/papel-usuario';
import { UsuarioRepository } from '../domain/usuario.repository';
import { extractStrictBearer } from './strict-bearer.extractor';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  papel: PapelUsuario;
  /** jti e expiração do access token atual (usados pelo logout/denylist). */
  jti: string;
  expiraEm: Date;
}

/** Payload verificado: o de assinatura + claims padrão (exp). */
type PayloadVerificado = PayloadToken & { exp: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly denylistRepository: AccessTokenDenylistRepository,
  ) {
    super({
      jwtFromRequest: extractStrictBearer,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Revalida o token contra o estado ATUAL do sistema (revogação server-side):
   * além da assinatura/expiração, exige que (1) o usuário exista e esteja ativo,
   * usando o `papel` atual como fonte da verdade, e (2) o token não esteja na
   * denylist (logout/ban). Assim, desativar/rebaixar um usuário ou revogar um
   * token vale imediatamente, sem esperar o token expirar.
   */
  async validate(payload: PayloadVerificado): Promise<UsuarioAutenticado> {
    const usuario = await this.usuarioRepository.buscarPorId(payload.sub);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError('Sessão inválida: usuário inexistente ou desativado.');
    }
    if (await this.denylistRepository.estaRevogado(payload.jti)) {
      throw new UnauthorizedError('Sessão encerrada: token revogado.');
    }
    return {
      id: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
      jti: payload.jti,
      expiraEm: new Date(payload.exp * 1000),
    };
  }
}
