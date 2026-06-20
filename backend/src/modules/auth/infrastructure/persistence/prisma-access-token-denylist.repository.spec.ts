import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { PrismaAccessTokenDenylistRepository } from './prisma-access-token-denylist.repository';

describe('PrismaAccessTokenDenylistRepository', () => {
  function criarRepo() {
    const accessTokenRevogado = { upsert: jest.fn(), findUnique: jest.fn() };
    const prisma = { client: { accessTokenRevogado } } as unknown as PrismaService;
    return { repo: new PrismaAccessTokenDenylistRepository(prisma), accessTokenRevogado };
  }

  it('revoga via upsert por jti', async () => {
    const { repo, accessTokenRevogado } = criarRepo();
    const exp = new Date(0);
    await repo.revogar('jti-1', exp);
    expect(accessTokenRevogado.upsert.mock.calls[0][0]).toMatchObject({
      where: { jti: 'jti-1' },
      create: { jti: 'jti-1', expiraEm: exp },
    });
  });

  it('estaRevogado true quando o jti existe', async () => {
    const { repo, accessTokenRevogado } = criarRepo();
    accessTokenRevogado.findUnique.mockResolvedValue({ jti: 'jti-1' });
    expect(await repo.estaRevogado('jti-1')).toBe(true);
  });

  it('estaRevogado false quando não existe', async () => {
    const { repo, accessTokenRevogado } = criarRepo();
    accessTokenRevogado.findUnique.mockResolvedValue(null);
    expect(await repo.estaRevogado('jti-x')).toBe(false);
  });
});
