import { TipoTransporte as TipoTransportePrisma } from '@prisma/client';
import { TipoTransporte } from '../../domain/tipo-transporte.entity';

/** Tradução bidirecional entre o registro do Prisma e a entidade de domínio. */
export class TipoTransporteMapper {
  static toDomain(raw: TipoTransportePrisma): TipoTransporte {
    return TipoTransporte.restaurar({
      id: raw.id,
      nome: raw.nome,
      codigo: raw.codigo,
      ativo: raw.ativo,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }

  static toPersistence(tipo: TipoTransporte): TipoTransportePrisma {
    return {
      id: tipo.id,
      nome: tipo.nome,
      codigo: tipo.codigo,
      ativo: tipo.ativo,
      criadoEm: tipo.criadoEm,
      atualizadoEm: tipo.atualizadoEm,
    };
  }
}
