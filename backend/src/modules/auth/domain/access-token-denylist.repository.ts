/**
 * Denylist de access tokens revogados por `jti` (logout/ban imediato). A
 * implementação guarda a expiração para permitir limpeza posterior.
 */
export abstract class AccessTokenDenylistRepository {
  abstract revogar(jti: string, expiraEm: Date): Promise<void>;
  abstract estaRevogado(jti: string): Promise<boolean>;
}
