import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UnauthorizedError } from '../../../../shared/domain/domain-error';
import { PapelUsuario } from '../../domain/papel-usuario';
import { UsuarioAutenticado } from '../jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

function contexto(): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('libera rotas públicas sem chamar o Passport', () => {
    const reflector = { getAllAndOverride: () => true } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(contexto())).toBe(true);
  });

  it('delega ao Passport (super) em rotas protegidas', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const superProto = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: () => boolean;
    };
    const spy = jest.spyOn(superProto, 'canActivate').mockReturnValue(true);

    const ctx = contexto();
    expect(guard.canActivate(ctx)).toBe(true);
    expect(spy).toHaveBeenCalledWith(ctx);
  });

  describe('handleRequest', () => {
    const guard = new JwtAuthGuard({ getAllAndOverride: () => false } as unknown as Reflector);
    const usuario: UsuarioAutenticado = { id: 'u1', email: 'e', papel: PapelUsuario.OPERADOR };

    it('retorna o usuário quando autenticado', () => {
      expect(guard.handleRequest(null, usuario, undefined, contexto())).toEqual(usuario);
    });

    it('lança UnauthorizedError (PT) quando não há usuário', () => {
      expect(() => guard.handleRequest(null, false, undefined, contexto())).toThrow(
        UnauthorizedError,
      );
      try {
        guard.handleRequest(null, false, undefined, contexto());
      } catch (e) {
        const err = e as UnauthorizedError;
        expect(err.code).toBe('UNAUTHORIZED');
        expect(err.message).toMatch(/autentica/i);
      }
    });

    it('lança UnauthorizedError quando o Passport reporta erro', () => {
      expect(() =>
        guard.handleRequest(new Error('jwt expired'), false, undefined, contexto()),
      ).toThrow(UnauthorizedError);
    });

    it('preserva a mensagem específica de um UnauthorizedError do validate()', () => {
      const especifico = new UnauthorizedError('Sessão inválida: usuário desativado.');
      try {
        guard.handleRequest(especifico, false, undefined, contexto());
        throw new Error('deveria ter lançado');
      } catch (e) {
        expect(e).toBe(especifico);
        expect((e as UnauthorizedError).message).toMatch(/desativado/i);
      }
    });
  });
});
