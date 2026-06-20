import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

if (!parsed.success) {
  // Falha cedo e de forma clara se a configuração de ambiente estiver errada.
  throw new Error(
    `Variáveis de ambiente inválidas: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const env = parsed.data;
