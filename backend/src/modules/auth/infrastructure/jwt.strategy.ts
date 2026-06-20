import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PayloadToken } from '../application/ports/token-generator';
import { PapelUsuario } from '../domain/papel-usuario';
import { extractStrictBearer } from './strict-bearer.extractor';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  papel: PapelUsuario;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractStrictBearer,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: PayloadToken): UsuarioAutenticado {
    return { id: payload.sub, email: payload.email, papel: payload.papel };
  }
}
