import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('login delega para o use-case', async () => {
    const login = {
      executar: jest.fn().mockResolvedValue({ accessToken: 't' }),
    } as unknown as LoginUseCase;
    const controller = new AuthController(login);

    const resultado = await controller.login({ email: 'op@ovgs.dev', senha: 'senha' });

    expect(login.executar).toHaveBeenCalledWith({ email: 'op@ovgs.dev', senha: 'senha' });
    expect(resultado).toEqual({ accessToken: 't' });
  });
});
