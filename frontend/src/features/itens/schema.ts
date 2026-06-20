import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  descricao: z.string(),
  unidade: z.string(),
  ativo: z.boolean(),
  criadoEm: z.string(),
});
export type Item = z.infer<typeof itemSchema>;

export const itemListSchema = z.array(itemSchema);

export const itemFormSchema = z.object({
  sku: z.string().min(1, 'Informe o SKU'),
  descricao: z.string().min(1, 'Informe a descrição'),
  unidade: z.string().min(1, 'Informe a unidade'),
});
export type ItemFormValues = z.infer<typeof itemFormSchema>;
