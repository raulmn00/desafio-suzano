import { Request } from 'express';

/**
 * Extrai o JWT de um header `Authorization` estritamente no formato
 * `Bearer <token>`: esquema `Bearer` exato (case-sensitive), um único espaço,
 * exatamente um token e nada além. Qualquer outra forma retorna `null`, levando
 * o Passport a responder 401. Mais rígido que o extrator padrão do passport-jwt,
 * que aceita `bearer` minúsculo e ignora sufixos após o token.
 */
export function extractStrictBearer(req: Request): string | null {
  const header = req.headers?.authorization;
  if (typeof header !== 'string') {
    return null;
  }
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match ? match[1] : null;
}
