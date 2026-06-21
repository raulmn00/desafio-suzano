import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '../../application/ports/event-bus';
import { EventoDominio } from '../../domain/evento-dominio';

/**
 * EventBus in-process (Fase 1): entrega o evento aos handlers `@OnEvent` do
 * mesmo processo via EventEmitter2. Os handlers rodam de forma síncrona.
 */
@Injectable()
export class InProcessEventBus extends EventBus {
  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  async publicar(evento: EventoDominio): Promise<void> {
    this.emitter.emit(evento.nome, evento);
  }
}
