import {
  Cliente as ClientePrisma,
  ClienteTipoTransporte,
  Prisma,
} from '@prisma/client';
import { Cliente } from '../../domain/cliente.entity';

export type ClienteComTransportes = ClientePrisma & {
  transportesAutorizados: ClienteTipoTransporte[];
};

export class ClienteMapper {
  static toDomain(raw: ClienteComTransportes): Cliente {
    return Cliente.restaurar({
      id: raw.id,
      nome: raw.nome,
      documento: raw.documento,
      ativo: raw.ativo,
      transportesAutorizados: raw.transportesAutorizados.map((t) => t.tipoTransporteId),
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }

  static toPersistence(cliente: Cliente): Prisma.ClienteUncheckedCreateInput {
    return {
      id: cliente.id,
      nome: cliente.nome,
      documento: cliente.documento.valor,
      ativo: cliente.ativo,
      criadoEm: cliente.criadoEm,
      atualizadoEm: cliente.atualizadoEm,
    };
  }
}
