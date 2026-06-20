import { ConfigService } from '@nestjs/config';
import { PapelUsuario } from '../domain/papel-usuario';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('valida o payload retornando o usuário autenticado', () => {
    const config = { get: () => 'segredo' } as unknown as ConfigService;
    const strategy = new JwtStrategy(config);

    expect(strategy.validate({ sub: 'u1', email: 'op@ovgs.dev', papel: PapelUsuario.OPERADOR })).toEqual({
      id: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
    });
  });

  it('usa o segredo padrão quando JWT_SECRET não está configurado', () => {
    const config = { get: () => undefined } as unknown as ConfigService;

    expect(() => new JwtStrategy(config)).not.toThrow();
  });
});
