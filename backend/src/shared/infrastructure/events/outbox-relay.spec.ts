import { Clock } from '../../application/ports/clock';
import { EventBus } from '../../application/ports/event-bus';
import { PrismaService } from '../persistence/prisma.service';
import { OutboxRelay } from './outbox-relay';

describe('OutboxRelay', () => {
  const agora = new Date('2026-01-01T00:00:00.000Z');
  const clock = { agora: () => agora } as Clock;

  function setup(pendentes: Array<{ id: string; nome: string; payload: unknown }>) {
    const findMany = jest.fn().mockResolvedValue(pendentes);
    const update = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      client: { outboxEvent: { findMany, update } },
    } as unknown as PrismaService;
    const publicar = jest.fn().mockResolvedValue(undefined);
    const bus = { publicar } as unknown as EventBus;
    return { relay: new OutboxRelay(prisma, bus, clock), findMany, update, publicar };
  }

  it('publica cada pendente via EventBus (reconstruindo o evento) e marca como publicado', async () => {
    const { relay, update, publicar } = setup([
      { id: 'e1', nome: 'ordem-venda.criada', payload: { ordemId: 'ov-1' } },
      { id: 'e2', nome: 'ordem-venda.status-alterado', payload: { ordemId: 'ov-1' } },
    ]);

    const n = await relay.processarPendentes();

    expect(n).toBe(2);
    expect(publicar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'ordem-venda.criada', ordemId: 'ov-1' }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { publicadoEm: agora },
    });
  });

  it('em falha de entrega, incrementa tentativas e NÃO marca como publicado', async () => {
    const { relay, update, publicar } = setup([{ id: 'e1', nome: 'x', payload: {} }]);
    publicar.mockRejectedValueOnce(new Error('broker fora'));

    const n = await relay.processarPendentes();

    expect(n).toBe(0);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { tentativas: { increment: 1 } },
    });
  });

  it('é não-reentrante: chamada concorrente retorna 0 sem reprocessar', async () => {
    let liberar!: (v: unknown) => void;
    const findMany = jest.fn().mockReturnValue(new Promise((r) => (liberar = r)));
    const prisma = {
      client: { outboxEvent: { findMany, update: jest.fn() } },
    } as unknown as PrismaService;
    const relay = new OutboxRelay(prisma, { publicar: jest.fn() } as unknown as EventBus, clock);

    const emAndamento = relay.processarPendentes();
    const concorrente = await relay.processarPendentes();

    expect(concorrente).toBe(0);
    liberar([]);
    await emAndamento;
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('varrer() delega para processarPendentes', async () => {
    const { relay, findMany } = setup([]);
    await relay.varrer();
    expect(findMany).toHaveBeenCalled();
  });
});
