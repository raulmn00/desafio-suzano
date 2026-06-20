import { z } from 'zod';

export const auditEventSchema = z.object({
  id: z.string(),
  ocorridoEm: z.string(),
  ator: z.string(),
  acao: z.string(),
  entidadeTipo: z.string(),
  entidadeId: z.string(),
  estadoAnterior: z.record(z.string(), z.unknown()).nullable(),
  estadoPosterior: z.record(z.string(), z.unknown()).nullable(),
  correlationId: z.string().nullable(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const auditEventListSchema = z.array(auditEventSchema);
