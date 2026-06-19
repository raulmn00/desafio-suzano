import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { TipoTransporte } from '../../domain/tipo-transporte.entity';
import { TipoTransporteRepository } from '../../domain/tipo-transporte.repository';
import { TipoTransporteMapper } from './tipo-transporte.mapper';

@Injectable()
export class PrismaTipoTransporteRepository extends TipoTransporteRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async salvar(tipoTransporte: TipoTransporte): Promise<void> {
    const dados = TipoTransporteMapper.toPersistence(tipoTransporte);
    await this.prisma.client.tipoTransporte.upsert({
      where: { id: dados.id },
      create: dados,
      update: dados,
    });
  }

  async buscarPorId(id: string): Promise<TipoTransporte | null> {
    const raw = await this.prisma.client.tipoTransporte.findUnique({ where: { id } });
    return raw ? TipoTransporteMapper.toDomain(raw) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<TipoTransporte | null> {
    const raw = await this.prisma.client.tipoTransporte.findUnique({ where: { codigo } });
    return raw ? TipoTransporteMapper.toDomain(raw) : null;
  }

  async listar(): Promise<TipoTransporte[]> {
    const registros = await this.prisma.client.tipoTransporte.findMany({
      orderBy: { criadoEm: 'asc' },
    });
    return registros.map(TipoTransporteMapper.toDomain);
  }

  async existePorId(id: string): Promise<boolean> {
    const total = await this.prisma.client.tipoTransporte.count({ where: { id } });
    return total > 0;
  }
}
