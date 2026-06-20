import { ConfigService } from '@nestjs/config';
import { UnauthorizedError } from '../../../shared/domain/domain-error';
import { PapelUsuario } from '../domain/papel-usuario';
import { Usuario } from '../domain/usuario.entity';
import { UsuarioRepository } from '../domain/usuario.repository';
import { JwtStrategy } from './jwt.strategy';

const config = { getOrThrow: () => 'segredo' } as unknown as ConfigService;

const usuarioAtivo = (papel: PapelUsuario) =>
  Usuario.restaurar({
    id: 'u1',
    email: 'op@ovgs.dev',
    nome: 'Operador',
    senhaHash: 'hash',
    papel,
    ativo: true,
  });

function repoMock(usuario: Usuario | null): UsuarioRepository {
  return {
    buscarPorEmail: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(usuario),
  } as unknown as UsuarioRepository;
}

const payload = { sub: 'u1', email: 'op@ovgs.dev', papel: PapelUsuario.OPERADOR };

describe('JwtStrategy', () => {
  it('revalida o usuário no banco e retorna o autenticado quando ativo', async () => {
    const strategy = new JwtStrategy(config, repoMock(usuarioAtivo(PapelUsuario.OPERADOR)));
    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
    });
  });

  it('usa o papel ATUAL do banco, não o do token (rebaixamento vale na hora)', async () => {
    // token diz OPERADOR, mas o banco já rebaixou para AUDITOR
    const strategy = new JwtStrategy(config, repoMock(usuarioAtivo(PapelUsuario.AUDITOR)));
    const u = await strategy.validate(payload);
    expect(u.papel).toBe(PapelUsuario.AUDITOR);
  });

  it('rejeita (401) quando o usuário não existe mais', async () => {
    const strategy = new JwtStrategy(config, repoMock(null));
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejeita (401) quando o usuário está desativado', async () => {
    const inativo = Usuario.restaurar({
      id: 'u1',
      email: 'op@ovgs.dev',
      nome: 'Operador',
      senhaHash: 'hash',
      papel: PapelUsuario.OPERADOR,
      ativo: false,
    });
    const strategy = new JwtStrategy(config, repoMock(inativo));
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('lê o segredo do ConfigService via getOrThrow (sem fallback silencioso)', () => {
    const getOrThrow = jest.fn().mockReturnValue('segredo');
    new JwtStrategy({ getOrThrow } as unknown as ConfigService, repoMock(null));
    expect(getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });
});
