import { ConfigService } from '@nestjs/config';
import { UnauthorizedError } from '../../../shared/domain/domain-error';
import { AccessTokenDenylistRepository } from '../domain/access-token-denylist.repository';
import { PapelUsuario } from '../domain/papel-usuario';
import { Usuario } from '../domain/usuario.entity';
import { UsuarioRepository } from '../domain/usuario.repository';
import { JwtStrategy } from './jwt.strategy';

const config = { getOrThrow: () => 'segredo' } as unknown as ConfigService;
const EXP = Math.floor(new Date('2026-06-20T00:15:00.000Z').getTime() / 1000);
const payload = {
  sub: 'u1',
  email: 'op@ovgs.dev',
  papel: PapelUsuario.OPERADOR,
  jti: 'jti-1',
  exp: EXP,
};

const usuarioAtivo = (papel: PapelUsuario) =>
  Usuario.restaurar({
    id: 'u1',
    email: 'op@ovgs.dev',
    nome: 'Op',
    senhaHash: 'h',
    papel,
    ativo: true,
  });

function repoMock(usuario: Usuario | null): UsuarioRepository {
  return {
    buscarPorEmail: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
  } as unknown as UsuarioRepository;
}

function denylistMock(revogado: boolean): AccessTokenDenylistRepository {
  return {
    revogar: jest.fn(),
    estaRevogado: jest.fn().mockResolvedValue(revogado),
  } as unknown as AccessTokenDenylistRepository;
}

describe('JwtStrategy', () => {
  it('revalida no banco, checa denylist e retorna o autenticado (com jti e expiraEm)', async () => {
    const strategy = new JwtStrategy(
      config,
      repoMock(usuarioAtivo(PapelUsuario.OPERADOR)),
      denylistMock(false),
    );
    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
      jti: 'jti-1',
      expiraEm: new Date(EXP * 1000),
    });
  });

  it('usa o papel ATUAL do banco, não o do token', async () => {
    const strategy = new JwtStrategy(
      config,
      repoMock(usuarioAtivo(PapelUsuario.AUDITOR)),
      denylistMock(false),
    );
    const u = await strategy.validate(payload);
    expect(u.papel).toBe(PapelUsuario.AUDITOR);
  });

  it('rejeita (401) quando o usuário não existe', async () => {
    const strategy = new JwtStrategy(config, repoMock(null), denylistMock(false));
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejeita (401) quando o usuário está desativado', async () => {
    const inativo = Usuario.restaurar({
      id: 'u1',
      email: 'op@ovgs.dev',
      nome: 'Op',
      senhaHash: 'h',
      papel: PapelUsuario.OPERADOR,
      ativo: false,
    });
    const strategy = new JwtStrategy(config, repoMock(inativo), denylistMock(false));
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejeita (401) quando o jti está na denylist (token revogado)', async () => {
    const strategy = new JwtStrategy(
      config,
      repoMock(usuarioAtivo(PapelUsuario.OPERADOR)),
      denylistMock(true),
    );
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('lê o segredo do ConfigService via getOrThrow', () => {
    const getOrThrow = jest.fn().mockReturnValue('segredo');
    new JwtStrategy(
      { getOrThrow } as unknown as ConfigService,
      repoMock(null),
      denylistMock(false),
    );
    expect(getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });
});
