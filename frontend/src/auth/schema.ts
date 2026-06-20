import { z } from 'zod';
import { usuarioSchema } from '../lib/storage';

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  usuario: usuarioSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
