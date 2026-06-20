import { ConfigService } from '@nestjs/config';
import { PapelUsuario } from '../domain/papel-usuario';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('valida o payload retornando o usuário autenticado', () => {
    const config = { getOrThrow: () => 'segredo' } as unknown as ConfigService;
    const strategy = new JwtStrategy(config);

    expect(
      strategy.validate({ sub: 'u1', email: 'op@ovgs.dev', papel: PapelUsuario.OPERADOR }),
    ).toEqual({
      id: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
    });
  });

  it('lê o segredo do ConfigService via getOrThrow (sem fallback silencioso)', () => {
    const getOrThrow = jest.fn().mockReturnValue('segredo');
    const config = { getOrThrow } as unknown as ConfigService;

    new JwtStrategy(config);

    expect(getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });
});
