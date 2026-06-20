import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { UnauthorizedError } from '../../../../shared/domain/domain-error';
import { IS_PUBLIC_KEY } from '../public.decorator';

/** Guard global de autenticação JWT. Rotas marcadas com @Public() são liberadas. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  /**
   * Substitui a `UnauthorizedException` padrão (mensagem "Unauthorized" em inglês)
   * por um `UnauthorizedError` de domínio com mensagem em PT, que o filtro de
   * borda traduz para o envelope `{ code: 'UNAUTHORIZED', ... }`.
   */
  handleRequest<TUser = UsuarioAutenticadoLike>(
    err: unknown,
    user: TUser | false,
    _info?: unknown,
    _context?: unknown,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedError(
        'Autenticação necessária: forneça um token Bearer válido no header Authorization.',
      );
    }
    return user;
  }
}

type UsuarioAutenticadoLike = { id: string; email: string };
