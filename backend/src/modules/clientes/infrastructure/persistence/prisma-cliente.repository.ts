import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { Cliente } from '../../domain/cliente.entity';
import { ClienteRepository } from '../../domain/cliente.repository';
import { ClienteMapper } from './cliente.mapper';

@Injectable()
export class PrismaClienteRepository extends ClienteRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async salvar(cliente: Cliente): Promise<void> {
    const dados = ClienteMapper.toPersistence(cliente);
    const transportes = [...cliente.transportesAutorizados];

    // Upsert do cliente + sincronização da tabela de autorizações de forma
    // atômica (reaproveita a transação corrente se houver, via ALS).
    await this.prisma.runInTransaction(async () => {
      await this.prisma.client.cliente.upsert({
        where: { id: dados.id },
        create: dados,
        update: dados,
      });
      await this.prisma.client.clienteTipoTransporte.deleteMany({
        where: { clienteId: cliente.id },
      });
      if (transportes.length > 0) {
        await this.prisma.client.clienteTipoTransporte.createMany({
          data: transportes.map((tipoTransporteId) => ({
            clienteId: cliente.id,
            tipoTransporteId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const raw = await this.prisma.client.cliente.findUnique({
      where: { id },
      include: { transportesAutorizados: true },
    });
    return raw ? ClienteMapper.toDomain(raw) : null;
  }

  async buscarPorDocumento(documento: string): Promise<Cliente | null> {
    const raw = await this.prisma.client.cliente.findUnique({
      where: { documento },
      include: { transportesAutorizados: true },
    });
    return raw ? ClienteMapper.toDomain(raw) : null;
  }

  async listar(): Promise<Cliente[]> {
    const registros = await this.prisma.client.cliente.findMany({
      include: { transportesAutorizados: true },
      orderBy: { criadoEm: 'asc' },
    });
    return registros.map(ClienteMapper.toDomain);
  }

  async existePorId(id: string): Promise<boolean> {
    const total = await this.prisma.client.cliente.count({ where: { id } });
    return total > 0;
  }
}
