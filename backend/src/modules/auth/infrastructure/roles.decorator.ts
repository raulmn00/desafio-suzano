import { SetMetadata } from '@nestjs/common';
import { PapelUsuario } from '../domain/papel-usuario';

export const ROLES_KEY = 'roles';

/** Restringe um handler/controller aos papéis informados (avaliado pelo RolesGuard). */
export const Roles = (...papeis: PapelUsuario[]) => SetMetadata(ROLES_KEY, papeis);
