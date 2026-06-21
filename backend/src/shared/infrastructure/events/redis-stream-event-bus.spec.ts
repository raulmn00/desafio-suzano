import { EventoDominio } from '../../domain/evento-dominio';
import {
  ClienteStreamPublisher,
  RedisStreamEventBus,
  STREAM_EVENTOS,
} from './redis-stream-event-bus';

describe('RedisStreamEventBus', () => {
  it('publica via XADD no stream com o evento serializado em "data"', async () => {
    const xadd = jest.fn().mockResolvedValue('1-0');
    const bus = new RedisStreamEventBus({ xadd } as ClienteStreamPublisher);
    const evento = {
      nome: 'ordem-venda.criada',
      id: 'evt-1',
      ordemId: 'ov-1',
    } as unknown as EventoDominio;

    await bus.publicar(evento);

    expect(xadd).toHaveBeenCalledWith(STREAM_EVENTOS, '*', 'data', JSON.stringify(evento));
  });
});
