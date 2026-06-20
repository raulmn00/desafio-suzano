import { http } from '../lib/http';
import { loginResponseSchema, type LoginFormValues, type LoginResponse } from './schema';

export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
  const { data } = await http.post('/auth/login', credentials);
  return loginResponseSchema.parse(data);
}

/** Encerra a sessão no servidor (revoga access via denylist + refresh). Best-effort. */
export async function logout(refreshToken?: string): Promise<void> {
  await http.post('/auth/logout', refreshToken ? { refreshToken } : {});
}
