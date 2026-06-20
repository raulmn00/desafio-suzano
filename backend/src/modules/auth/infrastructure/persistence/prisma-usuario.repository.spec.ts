import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { PapelUsuario } from '../../domain/papel-usuario';
import { PrismaUsuarioRepository } from './prisma-usuario.repository';

describe('PrismaUsuarioRepository', () => {
  const raw = {
    id: 'u1',
    email: 'op@ovgs.dev',
    nome: 'Operador',
    senhaHash: 'hash',
    papel: 'OPERADOR',
    ativo: true,
    criadoEm: new Date('2026-06-19'),
  };

  function criarRepo() {
    const usuario = { findUnique: jest.fn() };
    const prisma = { client: { usuario } } as unknown as PrismaService;
    return { repo: new PrismaUsuarioRepository(prisma), usuario };
  }

  it('mapeia o usuário encontrado', async () => {
    const { repo, usuario } = criarRepo();
    usuario.findUnique.mockResolvedValue(raw);

    const encontrado = await repo.buscarPorEmail('op@ovgs.dev');

    expect(encontrado?.papel).toBe(PapelUsuario.OPERADOR);
    expect(encontrado?.email).toBe('op@ovgs.dev');
  });

  it('retorna null quando não encontra', async () => {
    const { repo, usuario } = criarRepo();
    usuario.findUnique.mockResolvedValue(null);

    expect(await repo.buscarPorEmail('x@x.com')).toBeNull();
  });

  it('busca por id e mapeia o usuário encontrado', async () => {
    const { repo, usuario } = criarRepo();
    usuario.findUnique.mockResolvedValue(raw);

    const encontrado = await repo.buscarPorId('u1');

    expect(usuario.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(encontrado?.id).toBe('u1');
    expect(encontrado?.ativo).toBe(true);
  });

  it('busca por id retorna null quando não encontra', async () => {
    const { repo, usuario } = criarRepo();
    usuario.findUnique.mockResolvedValue(null);

    expect(await repo.buscarPorId('nope')).toBeNull();
  });
});
