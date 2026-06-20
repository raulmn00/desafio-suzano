import {
  EmitirRefreshTokenInput,
  RefreshTokenRepository,
  RegistroRefreshToken,
} from '../../../domain/refresh-token.repository';

interface Linha extends RegistroRefreshToken {
  rawToken: string;
}

export class InMemoryRefreshTokenRepository extends RefreshTokenRepository {
  readonly tokens: Linha[] = [];

  async emitir(input: EmitirRefreshTokenInput): Promise<void> {
    this.tokens.push({
      id: input.id,
      usuarioId: input.usuarioId,
      rawToken: input.rawToken,
      expiraEm: input.expiraEm,
      revogadoEm: null,
    });
  }

  async buscarPorToken(rawToken: string): Promise<RegistroRefreshToken | null> {
    const linha = this.tokens.find((t) => t.rawToken === rawToken);
    return linha
      ? {
          id: linha.id,
          usuarioId: linha.usuarioId,
          expiraEm: linha.expiraEm,
          revogadoEm: linha.revogadoEm,
        }
      : null;
  }

  async revogar(id: string): Promise<void> {
    const linha = this.tokens.find((t) => t.id === id);
    if (linha) {
      linha.revogadoEm = new Date();
    }
  }
}
