import { LogoutUseCase } from './logout.use-case';
import { InMemoryAccessTokenDenylistRepository } from './testing/in-memory-access-token-denylist.repository';
import { InMemoryRefreshTokenRepository } from './testing/in-memory-refresh-token.repository';

const EXP = new Date('2026-06-20T00:15:00.000Z');

describe('LogoutUseCase', () => {
  let refreshRepo: InMemoryRefreshTokenRepository;
  let denylist: InMemoryAccessTokenDenylistRepository;
  let useCase: LogoutUseCase;

  beforeEach(async () => {
    refreshRepo = new InMemoryRefreshTokenRepository();
    denylist = new InMemoryAccessTokenDenylistRepository();
    useCase = new LogoutUseCase(refreshRepo, denylist);
    await refreshRepo.emitir({
      id: 'r1',
      usuarioId: 'u1',
      rawToken: 'refresh-atual',
      expiraEm: new Date('2026-06-27T00:00:00.000Z'),
    });
  });

  it('revoga o access token atual (jti na denylist) e o refresh apresentado', async () => {
    await useCase.executar({ refreshToken: 'refresh-atual', jti: 'jti-1', accessExpiraEm: EXP });

    expect(await denylist.estaRevogado('jti-1')).toBe(true);
    expect(refreshRepo.tokens.find((t) => t.id === 'r1')?.revogadoEm).not.toBeNull();
  });

  it('funciona sem refresh token (revoga só o access atual)', async () => {
    await useCase.executar({ jti: 'jti-2', accessExpiraEm: EXP });
    expect(await denylist.estaRevogado('jti-2')).toBe(true);
  });

  it('ignora silenciosamente um refresh inexistente', async () => {
    await expect(
      useCase.executar({ refreshToken: 'nao-existe', jti: 'jti-3', accessExpiraEm: EXP }),
    ).resolves.toBeUndefined();
    expect(await denylist.estaRevogado('jti-3')).toBe(true);
  });
});
