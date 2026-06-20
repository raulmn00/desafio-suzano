import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import { FiltrosOrdemVenda, OrdemVendaRepository } from '../../domain/ordem-venda.repository';
import { OrdemVendaMapper } from './ordem-venda.mapper';

@Injectable()
export class PrismaOrdemVendaRepository extends OrdemVendaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async salvar(ordem: OrdemDeVenda): Promise<void> {
    const agendamento = ordem.agendamento;

    await this.prisma.runInTransaction(async () => {
      await this.prisma.client.ordemVenda.upsert({
        where: { id: ordem.id },
        create: {
          id: ordem.id,
          clienteId: ordem.clienteId,
          tipoTransporteId: ordem.tipoTransporteId,
          status: ordem.status,
          criadoEm: ordem.criadoEm,
          atualizadoEm: ordem.atualizadoEm,
        },
        update: {
          clienteId: ordem.clienteId,
          tipoTransporteId: ordem.tipoTransporteId,
          status: ordem.status,
          atualizadoEm: ordem.atualizadoEm,
        },
      });

      await this.prisma.client.itemOrdemVenda.deleteMany({ where: { ordemVendaId: ordem.id } });
      await this.prisma.client.itemOrdemVenda.createMany({
        data: ordem.itens.map((item) => ({
          id: `${ordem.id}:${item.itemId}`,
          ordemVendaId: ordem.id,
          itemId: item.itemId,
          quantidade: item.quantidade,
        })),
      });

      if (agendamento) {
        await this.prisma.client.agendamento.upsert({
          where: { ordemVendaId: ordem.id },
          create: {
            id: ordem.id,
            ordemVendaId: ordem.id,
            dataEntrega: agendamento.dataEntrega,
            janelaInicio: agendamento.janelaInicio,
            janelaFim: agendamento.janelaFim,
            confirmado: agendamento.confirmado,
          },
          update: {
            dataEntrega: agendamento.dataEntrega,
            janelaInicio: agendamento.janelaInicio,
            janelaFim: agendamento.janelaFim,
            confirmado: agendamento.confirmado,
          },
        });
      } else {
        await this.prisma.client.agendamento.deleteMany({ where: { ordemVendaId: ordem.id } });
      }
    });
  }

  async buscarPorId(id: string): Promise<OrdemDeVenda | null> {
    const raw = await this.prisma.client.ordemVenda.findUnique({
      where: { id },
      include: { itens: true, agendamento: true },
    });
    return raw ? OrdemVendaMapper.toDomain(raw) : null;
  }

  async listar(filtros: FiltrosOrdemVenda): Promise<OrdemDeVenda[]> {
    const where: Prisma.OrdemVendaWhereInput = {
      status: filtros.status,
      clienteId: filtros.clienteId,
      tipoTransporteId: filtros.tipoTransporteId,
      criadoEm:
        filtros.criadoDe || filtros.criadoAte
          ? { gte: filtros.criadoDe, lte: filtros.criadoAte }
          : undefined,
    };

    const registros = await this.prisma.client.ordemVenda.findMany({
      where,
      include: { itens: true, agendamento: true },
      orderBy: { criadoEm: 'desc' },
    });
    return registros.map(OrdemVendaMapper.toDomain);
  }

  async existePorId(id: string): Promise<boolean> {
    const total = await this.prisma.client.ordemVenda.count({ where: { id } });
    return total > 0;
  }
}
