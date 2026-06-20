import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../../../shared/domain/domain-error';
import { PapelUsuario } from '../../domain/papel-usuario';
import { UsuarioAutenticado } from '../jwt.strategy';
import { ROLES_KEY } from '../roles.decorator';

/** Guard global de autorização por papel (RBAC). Sem @Roles, libera. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeisExigidos = this.reflector.getAllAndOverride<PapelUsuario[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!papeisExigidos || papeisExigidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>();
    const usuario = request.user;
    if (usuario !== undefined && papeisExigidos.includes(usuario.papel)) {
      return true;
    }

    const exigido = papeisExigidos.join(' ou ');
    throw new ForbiddenError(
      `Acesso negado: este recurso exige o papel ${exigido}. ` +
        'Seu usuário não tem permissão para esta ação.',
    );
  }
}
