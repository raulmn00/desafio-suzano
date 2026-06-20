import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UnauthorizedError } from '../../../shared/domain/domain-error';
import { PayloadToken } from '../application/ports/token-generator';
import { PapelUsuario } from '../domain/papel-usuario';
import { UsuarioRepository } from '../domain/usuario.repository';
import { extractStrictBearer } from './strict-bearer.extractor';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  papel: PapelUsuario;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usuarioRepository: UsuarioRepository,
  ) {
    super({
      jwtFromRequest: extractStrictBearer,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Revalida o token contra o estado ATUAL do usuário no banco (revogação
   * server-side): além da assinatura/expiração, exige que o usuário ainda exista
   * e esteja ativo, e usa o `papel` atual como fonte da verdade. Assim, desativar
   * ou rebaixar um usuário passa a valer imediatamente, sem esperar o token expirar.
   */
  async validate(payload: PayloadToken): Promise<UsuarioAutenticado> {
    const usuario = await this.usuarioRepository.buscarPorId(payload.sub);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError('Sessão inválida: usuário inexistente ou desativado.');
    }
    return { id: usuario.id, email: usuario.email, papel: usuario.papel };
  }
}
