/** Estado persistido de um refresh token (o token bruto nunca é guardado). */
export interface RegistroRefreshToken {
  id: string;
  usuarioId: string;
  expiraEm: Date;
  revogadoEm: Date | null;
}

export interface EmitirRefreshTokenInput {
  id: string;
  usuarioId: string;
  rawToken: string;
  expiraEm: Date;
}

/**
 * Persistência de refresh tokens. A implementação guarda apenas o HASH do token
 * bruto; as buscas recebem o token bruto e comparam pelo hash.
 */
export abstract class RefreshTokenRepository {
  abstract emitir(input: EmitirRefreshTokenInput): Promise<void>;
  abstract buscarPorToken(rawToken: string): Promise<RegistroRefreshToken | null>;
  abstract revogar(id: string): Promise<void>;
}
