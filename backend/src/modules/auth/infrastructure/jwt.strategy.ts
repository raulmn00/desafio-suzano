import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadToken } from '../application/ports/token-generator';
import { PapelUsuario } from '../domain/papel-usuario';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  papel: PapelUsuario;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  validate(payload: PayloadToken): UsuarioAutenticado {
    return { id: payload.sub, email: payload.email, papel: payload.papel };
  }
}
