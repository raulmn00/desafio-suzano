import { AccessTokenDenylistRepository } from '../../../domain/access-token-denylist.repository';

export class InMemoryAccessTokenDenylistRepository extends AccessTokenDenylistRepository {
  readonly revogados = new Map<string, Date>();

  async revogar(jti: string, expiraEm: Date): Promise<void> {
    this.revogados.set(jti, expiraEm);
  }

  async estaRevogado(jti: string): Promise<boolean> {
    return this.revogados.has(jti);
  }
}
