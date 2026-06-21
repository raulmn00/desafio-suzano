import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Clock } from '../../application/ports/clock';
import { EventBus } from '../../application/ports/event-bus';
import { EventoDominio } from '../../domain/evento-dominio';
import { PrismaService } from '../persistence/prisma.service';

const TAMANHO_LOTE = 100;

/**
 * Relay do outbox transacional: lê os eventos pendentes (`publicadoEm` nulo) e os
 * entrega via `EventBus`, marcando-os como publicados — entrega **at-least-once**
 * (publica e SÓ ENTÃO marca; um crash no meio reentrega no próximo ciclo).
 *
 * Roda periodicamente (`@Interval`) e também é invocável manualmente
 * (`processarPendentes`, útil em testes e em um gatilho pós-commit). É
 * não-reentrante no processo (`rodando`) para não duplicar entre ciclo e flush.
 *
 * Caveat serverless: num serviço scale-to-zero, o ciclo só roda com uma
 * instância viva. A durabilidade está garantida pela tabela; a latência de
 * entrega depende de haver instância (use `min-instances>=1` ou um gatilho
 * externo — ex.: Cloud Scheduler — para entrega pronta no ocioso).
 */
@Injectable()
export class OutboxRelay {
  private readonly logger = new Logger(OutboxRelay.name);
  private rodando = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
  ) {}

  @Interval(5000)
  async varrer(): Promise<void> {
    await this.processarPendentes();
  }

  /** Entrega o lote de eventos pendentes. Devolve quantos foram publicados. */
  async processarPendentes(): Promise<number> {
    if (this.rodando) {
      return 0;
    }
    this.rodando = true;
    let publicados = 0;
    try {
      const pendentes = await this.prisma.client.outboxEvent.findMany({
        where: { publicadoEm: null },
        orderBy: { criadoEm: 'asc' },
        take: TAMANHO_LOTE,
      });

      for (const linha of pendentes) {
        try {
          const evento = {
            ...(linha.payload as Record<string, unknown>),
            nome: linha.nome,
          } as unknown as EventoDominio;
          await this.eventBus.publicar(evento);
          await this.prisma.client.outboxEvent.update({
            where: { id: linha.id },
            data: { publicadoEm: this.clock.agora() },
          });
          publicados++;
        } catch (erro) {
          await this.prisma.client.outboxEvent.update({
            where: { id: linha.id },
            data: { tentativas: { increment: 1 } },
          });
          this.logger.warn(
            `Falha ao entregar evento ${linha.id} (${linha.nome}): ${(erro as Error).message}`,
          );
        }
      }
    } finally {
      this.rodando = false;
    }
    return publicados;
  }
}
