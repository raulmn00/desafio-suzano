import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
});
