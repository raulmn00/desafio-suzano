import { PapelUsuario } from '../../domain/papel-usuario';

export interface PayloadToken {
  sub: string;
  email: string;
  papel: PapelUsuario;
}

/** Port de emissão de token de acesso (JWT). */
export abstract class TokenGenerator {
  abstract gerar(payload: PayloadToken): string;
}
