import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisher } from '../../application/ports/event-publisher';
import { EventoDominio } from '../../domain/evento-dominio';

/** Adapter in-process do EventPublisher sobre o EventEmitter2 do Nest. */
@Injectable()
export class NestEventPublisher extends EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  publicar(evento: EventoDominio): void {
    this.emitter.emit(evento.nome, evento);
  }
}
