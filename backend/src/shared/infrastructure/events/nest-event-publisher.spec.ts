import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestEventPublisher } from './nest-event-publisher';

describe('NestEventPublisher', () => {
  it('emite o evento usando seu nome como chave de roteamento', () => {
    const emit = jest.fn();
    const publisher = new NestEventPublisher({ emit } as unknown as EventEmitter2);
    const evento = { nome: 'ordem-venda.criada', ordemId: 'ov1' };

    publisher.publicar(evento);

    expect(emit).toHaveBeenCalledWith('ordem-venda.criada', evento);
  });
});
