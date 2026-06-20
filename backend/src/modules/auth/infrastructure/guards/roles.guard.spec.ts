import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
    expect(
      guard.canActivate(contexto({ id: 'u1', email: 'e', papel: PapelUsuario.OPERADOR })),
    ).toBe(true);
  });

  it('bloqueia quando o usuário não possui o papel', () => {
    const guard = new RolesGuard(reflectorComPapeis([PapelUsuario.AUDITOR]));
    expect(
      guard.canActivate(contexto({ id: 'u1', email: 'e', papel: PapelUsuario.OPERADOR })),
    ).toBe(false);
  });

  it('bloqueia quando não há usuário autenticado', () => {
    const guard = new RolesGuard(reflectorComPapeis([PapelUsuario.OPERADOR]));
    expect(guard.canActivate(contexto(undefined))).toBe(false);
  });
});
