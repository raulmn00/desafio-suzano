import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { PrismaRefreshTokenRepository } from './prisma-refresh-token.repository';

describe('PrismaRefreshTokenRepository', () => {
  function criarRepo() {
    const refreshToken = { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() };
    const prisma = { client: { refreshToken } } as unknown as PrismaService;
    return { repo: new PrismaRefreshTokenRepository(prisma), refreshToken };
  }

  it('emite persistindo o HASH do token (não o token bruto)', async () => {
    const { repo, refreshToken } = criarRepo();
    await repo.emitir({ id: 'r1', usuarioId: 'u1', rawToken: 'segredo', expiraEm: new Date(0) });

    const data = refreshToken.create.mock.calls[0][0].data;
    expect(data.id).toBe('r1');
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.tokenHash).not.toBe('segredo');
  });

  it('busca pelo hash do token bruto e mapeia o registro', async () => {
    const { repo, refreshToken } = criarRepo();
    refreshToken.findUnique.mockResolvedValue({
      id: 'r1',
      usuarioId: 'u1',
      expiraEm: new Date(0),
      revogadoEm: null,
    });

    const reg = await repo.buscarPorToken('segredo');

    expect(refreshToken.findUnique.mock.calls[0][0].where.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(reg?.id).toBe('r1');
    expect(reg?.usuarioId).toBe('u1');
  });

  it('retorna null quando o token não existe', async () => {
    const { repo, refreshToken } = criarRepo();
    refreshToken.findUnique.mockResolvedValue(null);
    expect(await repo.buscarPorToken('x')).toBeNull();
  });

  it('revoga marcando revogadoEm', async () => {
    const { repo, refreshToken } = criarRepo();
    await repo.revogar('r1');
    expect(refreshToken.update.mock.calls[0][0].where).toEqual({ id: 'r1' });
    expect(refreshToken.update.mock.calls[0][0].data.revogadoEm).toBeInstanceOf(Date);
  });
});
