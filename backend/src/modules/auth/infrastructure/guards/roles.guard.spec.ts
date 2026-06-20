import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../../../shared/domain/domain-error';
import { PapelUsuario } from '../../domain/papel-usuario';
import { UsuarioAutenticado } from '../jwt.strategy';
import { RolesGuard } from './roles.guard';

function contexto(user?: UsuarioAutenticado): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorComPapeis(papeis: PapelUsuario[] | undefined): Reflector {
  return { getAllAndOverride: () => papeis } as unknown as Reflector;
}

const autenticado = (papel: PapelUsuario): UsuarioAutenticado => ({
  id: 'u1',
  email: 'e',
  papel,
  jti: 'jti-1',
  expiraEm: new Date(0),
});

describe('RolesGuard', () => {
  it('libera quando nenhum papel é exigido', () => {
    const guard = new RolesGuard(reflectorComPapeis(undefined));
    expect(guard.canActivate(contexto())).toBe(true);
  });

  it('libera quando a lista de papéis está vazia', () => {
    const guard = new RolesGuard(reflectorComPapeis([]));
    expect(guard.canActivate(contexto())).toBe(true);
  });

  it('libera quando o usuário possui o papel exigido', () => {
    const guard = new RolesGuard(reflectorComPapeis([PapelUsuario.OPERADOR]));
    expect(guard.canActivate(contexto(autenticado(PapelUsuario.OPERADOR)))).toBe(true);
  });

  it('lança ForbiddenError (PT, nomeando o papel exigido) quando o usuário não possui o papel', () => {
    const guard = new RolesGuard(reflectorComPapeis([PapelUsuario.OPERADOR]));
    expect(() => guard.canActivate(contexto(autenticado(PapelUsuario.AUDITOR)))).toThrow(
      ForbiddenError,
    );
    try {
      guard.canActivate(contexto(autenticado(PapelUsuario.AUDITOR)));
    } catch (e) {
      const err = e as ForbiddenError;
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toContain('OPERADOR');
      expect(err.message).toMatch(/acesso negado/i);
    }
  });

  it('lança ForbiddenError quando não há usuário autenticado', () => {
    const guard = new RolesGuard(reflectorComPapeis([PapelUsuario.OPERADOR]));
    expect(() => guard.canActivate(contexto(undefined))).toThrow(ForbiddenError);
  });
});
