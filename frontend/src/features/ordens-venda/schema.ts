import { z } from 'zod';
import { isValidHorario } from '../../lib/validators';

export const statusOvSchema = z.enum([
  'CRIADA',
  'PLANEJADA',
  'AGENDADA',
  'EM_TRANSPORTE',
  'ENTREGUE',
]);
export type StatusOv = z.infer<typeof statusOvSchema>;

export const agendamentoSchema = z.object({
  dataEntrega: z.string(),
  janelaInicio: z.string(),
  janelaFim: z.string(),
  confirmado: z.boolean(),
});
export type Agendamento = z.infer<typeof agendamentoSchema>;

export const ordemItemSchema = z.object({
  itemId: z.string(),
  quantidade: z.number(),
});

export const ordemVendaSchema = z.object({
  id: z.string(),
  clienteId: z.string(),
  tipoTransporteId: z.string(),
  status: statusOvSchema,
  itens: z.array(ordemItemSchema),
  agendamento: agendamentoSchema.nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export type OrdemVenda = z.infer<typeof ordemVendaSchema>;

export const ordemVendaListSchema = z.array(ordemVendaSchema);

// ---------- Form de criação ----------
export const criarOrdemFormSchema = z.object({
  clienteId: z.string().min(1, 'Selecione o cliente'),
  tipoTransporteId: z.string().min(1, 'Selecione o transporte'),
  itens: z
    .array(
      z.object({
        itemId: z.string().min(1, 'Selecione o item'),
        quantidade: z.coerce
          .number({ invalid_type_error: 'Quantidade inválida' })
          .int('Quantidade deve ser inteira')
          .min(1, 'Quantidade deve ser ≥ 1'),
      }),
    )
    .min(1, 'Adicione ao menos um item'),
});
export type CriarOrdemFormValues = z.infer<typeof criarOrdemFormSchema>;

// ---------- Agendamento ----------
const horario = z.string().refine(isValidHorario, 'Horário inválido (HH:mm)');
export const agendamentoFormSchema = z
  .object({
    dataEntrega: z.string().min(1, 'Informe a data de entrega'),
    janelaInicio: horario,
    janelaFim: horario,
  })
  .refine((v) => v.janelaInicio < v.janelaFim, {
    message: 'Janela final deve ser maior que a inicial',
    path: ['janelaFim'],
  });
export type AgendamentoFormValues = z.infer<typeof agendamentoFormSchema>;
