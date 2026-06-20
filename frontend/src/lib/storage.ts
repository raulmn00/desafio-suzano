import { z } from 'zod';

export const TOKEN_KEY = 'ovgs.token';
export const REFRESH_KEY = 'ovgs.refresh';
export const USER_KEY = 'ovgs.user';

export const papelSchema = z.enum(['OPERADOR', 'AUDITOR']);
export type Papel = z.infer<typeof papelSchema>;

export const usuarioSchema = z.object({
  id: z.string(),
  email: z.string(),
  nome: z.string(),
  papel: papelSchema,
});
export type Usuario = z.infer<typeof usuarioSchema>;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

/** Atualiza o par de tokens após um refresh bem-sucedido (rotação). */
export function updateTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getStoredUser(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return usuarioSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function persistSession(token: string, refreshToken: string, usuario: Usuario): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
