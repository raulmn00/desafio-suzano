import { z } from 'zod';
import { isValidDocumento } from '../../lib/validators';

export const clienteSchema = z.object({
  id: z.string(),
  nome: z.string(),
  documento: z.string(),
  tipoDocumento: z.enum(['CPF', 'CNPJ']),
  ativo: z.boolean(),
  transportesAutorizados: z.array(z.string()),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type Cliente = z.infer<typeof clienteSchema>;

export const clienteListSchema = z.array(clienteSchema);

export const clienteFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  documento: z
    .string()
    .min(1, 'Informe o documento')
    .refine(isValidDocumento, 'Documento inválido (CPF com 11 ou CNPJ com 14 dígitos)'),
});
export type ClienteFormValues = z.infer<typeof clienteFormSchema>;
