import { z } from 'zod';

export const tipoTransporteSchema = z.object({
  id: z.string(),
  nome: z.string(),
  codigo: z.string(),
  ativo: z.boolean(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type TipoTransporte = z.infer<typeof tipoTransporteSchema>;

export const tipoTransporteListSchema = z.array(tipoTransporteSchema);

export const tipoTransporteFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  codigo: z.string().min(1, 'Informe o código'),
});
export type TipoTransporteFormValues = z.infer<typeof tipoTransporteFormSchema>;
