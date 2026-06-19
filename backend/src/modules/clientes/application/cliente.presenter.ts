import { Cliente } from '../domain/cliente.entity';

export interface ClienteView {
  id: string;
  nome: string;
  documento: string;
  tipoDocumento: 'CPF' | 'CNPJ';
  ativo: boolean;
  transportesAutorizados: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export function apresentarCliente(cliente: Cliente): ClienteView {
  return {
    id: cliente.id,
    nome: cliente.nome,
    documento: cliente.documento.valor,
    tipoDocumento: cliente.documento.tipo,
    ativo: cliente.ativo,
    transportesAutorizados: [...cliente.transportesAutorizados],
    criadoEm: cliente.criadoEm.toISOString(),
    atualizadoEm: cliente.atualizadoEm.toISOString(),
  };
}
