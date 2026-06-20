import { randomUUID } from 'node:crypto';
import { IncomingHttpHeaders } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Resolve o correlation id de uma requisição: usa o header `x-request-id`
 * recebido (propagação entre serviços) ou gera um UUID novo.
 */
export function resolverRequestId(headers: IncomingHttpHeaders): string {
  const bruto = headers[REQUEST_ID_HEADER];
  const valor = Array.isArray(bruto) ? bruto[0] : bruto;
  if (typeof valor === 'string' && valor.trim().length > 0) {
    return valor;
  }
  return randomUUID();
}
