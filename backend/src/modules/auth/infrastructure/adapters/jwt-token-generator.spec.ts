import { JwtService } from '@nestjs/jwt';
import { PapelUsuario } from '../../domain/papel-usuario';
import { JwtTokenGenerator } from './jwt-token-generator';

describe('JwtTokenGenerator', () => {
  it('assina o payload e retorna o token', () => {
    const jwtService = { sign: jest.fn().mockReturnValue('jwt-token') } as unknown as JwtService;
    const generator = new JwtTokenGenerator(jwtService);

    const token = generator.gerar({ sub: 'u1', email: 'op@ovgs.dev', papel: PapelUsuario.OPERADOR });

    expect(token).toBe('jwt-token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
    });
  });
});
