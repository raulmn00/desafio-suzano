import { z } from 'zod';

export const TOKEN_KEY = 'ovgs.token';
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

export function getStoredUser(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return usuarioSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function persistSession(token: string, usuario: Usuario): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
