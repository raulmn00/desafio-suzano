import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequisicaoComUsuario {
  user?: { email?: string };
}

/** Resolve o ator (e-mail do usuário autenticado, ou "sistema" se anônimo). */
export function resolverAtor(req: RequisicaoComUsuario): string {
  return req.user?.email ?? 'sistema';
}

/** Injeta o ator atual em um parâmetro do controller. */
export const AtorAtual = createParamDecorator((_data: unknown, ctx: ExecutionContext): string =>
  resolverAtor(ctx.switchToHttp().getRequest<RequisicaoComUsuario>()),
);
