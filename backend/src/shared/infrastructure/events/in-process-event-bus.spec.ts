import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventoDominio } from '../../domain/evento-dominio';
import { InProcessEventBus } from './in-process-event-bus';

describe('InProcessEventBus', () => {
  it('emite o evento no EventEmitter2 usando o nome como chave de roteamento', async () => {
    const emitter = { emit: jest.fn() } as unknown as EventEmitter2;
    const bus = new InProcessEventBus(emitter);
    const evento = { nome: 'ordem-venda.criada', ordemId: 'ov-1' } as unknown as EventoDominio;

    await bus.publicar(evento);

    expect(emitter.emit).toHaveBeenCalledWith('ordem-venda.criada', evento);
  });
});
