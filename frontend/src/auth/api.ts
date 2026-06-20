import { http } from '../lib/http';
import { loginResponseSchema, type LoginFormValues, type LoginResponse } from './schema';

export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
  const { data } = await http.post('/auth/login', credentials);
  return loginResponseSchema.parse(data);
}
