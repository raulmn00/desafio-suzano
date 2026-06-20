import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { PapelUsuario } from '../../domain/papel-usuario';
import { UsuarioAutenticado } from '../jwt.strategy';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const login = {
    executar: jest.fn().mockResolvedValue({ accessToken: 't', refreshToken: 'r' }),
  } as unknown as LoginUseCase;
  const refresh = {
    executar: jest.fn().mockResolvedValue({ accessToken: 't2', refreshToken: 'r2' }),
  } as unknown as RefreshTokenUseCase;
  const logout = { executar: jest.fn().mockResolvedValue(undefined) } as unknown as LogoutUseCase;
  const controller = new AuthController(login, refresh, logout);

  it('login delega para o use-case', async () => {
    const r = await controller.login({ email: 'op@ovgs.dev', senha: 'senha' });
    expect(login.executar).toHaveBeenCalledWith({ email: 'op@ovgs.dev', senha: 'senha' });
    expect(r).toEqual({ accessToken: 't', refreshToken: 'r' });
  });

  it('refresh delega para o use-case', async () => {
    const r = await controller.refresh({ refreshToken: 'r' });
    expect(refresh.executar).toHaveBeenCalledWith({ refreshToken: 'r' });
    expect(r).toEqual({ accessToken: 't2', refreshToken: 'r2' });
  });

  it('logout repassa jti/expiração do usuário atual + refresh do body', async () => {
    const usuario: UsuarioAutenticado = {
      id: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
      jti: 'jti-1',
      expiraEm: new Date('2026-06-20T00:15:00.000Z'),
    };
    await controller.logout({ refreshToken: 'r' }, usuario);
    expect(logout.executar).toHaveBeenCalledWith({
      refreshToken: 'r',
      jti: 'jti-1',
      accessExpiraEm: usuario.expiraEm,
    });
  });
});
