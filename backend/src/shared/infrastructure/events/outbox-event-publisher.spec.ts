import { Clock } from '../../application/ports/clock';
import { IdGenerator } from '../../application/ports/id-generator';
import { EventoDominio } from '../../domain/evento-dominio';
import { PrismaService } from '../persistence/prisma.service';
import { OutboxEventPublisher } from './outbox-event-publisher';

describe('OutboxEventPublisher', () => {
  const agora = new Date('2026-01-01T00:00:00.000Z');
  const clock = { agora: () => agora } as Clock;
  const idGen = { gerar: () => 'evt-1' } as IdGenerator;

  function setup() {
    const create = jest.fn().mockResolvedValue(undefined);
    const prisma = { client: { outboxEvent: { create } } } as unknown as PrismaService;
    return { create, pub: new OutboxEventPublisher(prisma, clock, idGen) };
  }

  it('grava o evento no outbox (id, nome, payload e ocorridoEm do próprio evento)', async () => {
    const { create, pub } = setup();
    const ocorridoEm = new Date('2026-02-02T10:00:00.000Z');
    await pub.publicar({
      nome: 'ordem-venda.criada',
      ordemId: 'ov-1',
      ocorridoEm,
    } as unknown as EventoDominio);

    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data).toEqual(
      expect.objectContaining({ id: 'evt-1', nome: 'ordem-venda.criada', ocorridoEm }),
    );
    expect(data.payload).toMatchObject({ nome: 'ordem-venda.criada', ordemId: 'ov-1' });
  });

  it('usa o relógio quando o evento não traz ocorridoEm', async () => {
    const { create, pub } = setup();
    await pub.publicar({ nome: 'algum.evento' } as unknown as EventoDominio);
    expect(create.mock.calls[0][0].data.ocorridoEm).toEqual(agora);
  });
});
