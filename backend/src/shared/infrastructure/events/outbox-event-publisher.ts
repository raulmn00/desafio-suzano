import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Clock } from '../../application/ports/clock';
import { EventPublisher } from '../../application/ports/event-publisher';
import { IdGenerator } from '../../application/ports/id-generator';
import { EventoDominio } from '../../domain/evento-dominio';
import { PrismaService } from '../persistence/prisma.service';

/**
 * Publica eventos de domínio gravando-os no OUTBOX usando o client ativo do
 * Prisma — transacional quando dentro de `TransactionManager.executar`. Assim o
 * evento é persistido na MESMA transação da mudança de estado (atômico, sem
 * perda em crash). A entrega real fica a cargo do `OutboxRelay`.
 */
@Injectable()
export class OutboxEventPublisher extends EventPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {
    super();
  }

  async publicar(evento: EventoDominio): Promise<void> {
    const ocorridoEm =
      evento instanceof Object && 'ocorridoEm' in evento && evento.ocorridoEm instanceof Date
        ? evento.ocorridoEm
        : this.clock.agora();
    await this.prisma.client.outboxEvent.create({
      data: {
        id: this.idGenerator.gerar(),
        nome: evento.nome,
        payload: { ...evento } as Prisma.InputJsonValue,
        ocorridoEm,
      },
    });
  }
}
