import { TipoTransporte } from './tipo-transporte.entity';

/**
 * Port de persistência de tipos de transporte. Implementado na infraestrutura
 * (Prisma) e por um fake in-memory nos testes. É um `abstract class` para servir
 * simultaneamente de tipo e de token de injeção de dependência no NestJS.
 */
export abstract class TipoTransporteRepository {
  abstract salvar(tipoTransporte: TipoTransporte): Promise<void>;
  abstract buscarPorId(id: string): Promise<TipoTransporte | null>;
  abstract buscarPorCodigo(codigo: string): Promise<TipoTransporte | null>;
  abstract listar(): Promise<TipoTransporte[]>;
  abstract existePorId(id: string): Promise<boolean>;
}
