import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GRUPO_CONSUMIDORES, RedisStreamConsumer } from './redis-stream-consumer';
import { STREAM_EVENTOS } from './redis-stream-event-bus';

function criar(overrides: Record<string, unknown> = {}) {
  const config = { get: () => undefined } as unknown as ConfigService;
  const emitter = { emit: jest.fn() } as unknown as EventEmitter2;
  const consumer = new RedisStreamConsumer(config, emitter);
  const client = {
    xgroup: jest.fn().mockResolvedValue('OK'),
    xreadgroup: jest.fn(),
    xack: jest.fn().mockResolvedValue(1),
    xautoclaim: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  };
  (consumer as unknown as { client: unknown }).client = client;
  return { consumer, client, emitter };
}

describe('RedisStreamConsumer', () => {
  describe('processarEntradas', () => {
    it('despacha eventos novos no emitter local e dá ACK', async () => {
      const { consumer, client, emitter } = criar();
      const entradas = [
        {
          id: '1-0',
          data: JSON.stringify({ nome: 'ordem-venda.criada', id: 'evt-1', ordemId: 'ov-1' }),
        },
      ];

      const n = await consumer.processarEntradas(entradas);

      expect(n).toBe(1);
      expect(emitter.emit).toHaveBeenCalledWith(
        'ordem-venda.criada',
        expect.objectContaining({ ordemId: 'ov-1' }),
      );
      expect(client.xack).toHaveBeenCalledWith(STREAM_EVENTOS, GRUPO_CONSUMIDORES, '1-0');
    });

    it('idempotência: evento já visto (SET NX = null) não redispara, mas dá ACK', async () => {
      const { consumer, client, emitter } = criar({ set: jest.fn().mockResolvedValue(null) });

      const n = await consumer.processarEntradas([
        { id: '1-0', data: JSON.stringify({ nome: 'x', id: 'evt-1' }) },
      ]);

      expect(n).toBe(0);
      expect(emitter.emit).not.toHaveBeenCalled();
      expect(client.xack).toHaveBeenCalled();
    });

    it('JSON inválido: NÃO dá ACK (fica pendente para reentrega)', async () => {
      const { consumer, client } = criar();
      const n = await consumer.processarEntradas([{ id: '1-0', data: 'nao-json{' }]);
      expect(n).toBe(0);
      expect(client.xack).not.toHaveBeenCalled();
    });
  });

  describe('extração de respostas do Redis', () => {
    it('extrairDeLeitura normaliza o XREADGROUP', () => {
      const { consumer } = criar();
      const resp = [[STREAM_EVENTOS, [['1-0', ['data', '{"nome":"x"}']]]]];
      expect(consumer.extrairDeLeitura(resp)).toEqual([{ id: '1-0', data: '{"nome":"x"}' }]);
      expect(consumer.extrairDeLeitura(null)).toEqual([]);
    });

    it('extrairDeAutoclaim normaliza o XAUTOCLAIM', () => {
      const { consumer } = criar();
      const resp = ['0-0', [['2-0', ['data', '{"nome":"y"}']]], []];
      expect(consumer.extrairDeAutoclaim(resp)).toEqual([{ id: '2-0', data: '{"nome":"y"}' }]);
      expect(consumer.extrairDeAutoclaim(null)).toEqual([]);
    });
  });

  describe('garantirGrupo', () => {
    it('cria o consumer group', async () => {
      const { consumer, client } = criar();
      await consumer.garantirGrupo();
      expect(client.xgroup).toHaveBeenCalledWith(
        'CREATE',
        STREAM_EVENTOS,
        GRUPO_CONSUMIDORES,
        '$',
        'MKSTREAM',
      );
    });

    it('ignora BUSYGROUP (grupo já existe)', async () => {
      const { consumer } = criar({
        xgroup: jest
          .fn()
          .mockRejectedValue(new Error('BUSYGROUP Consumer Group name already exists')),
      });
      await expect(consumer.garantirGrupo()).resolves.toBeUndefined();
    });

    it('propaga outros erros', async () => {
      const { consumer } = criar({ xgroup: jest.fn().mockRejectedValue(new Error('boom')) });
      await expect(consumer.garantirGrupo()).rejects.toThrow('boom');
    });
  });

  describe('reivindicarPendentes', () => {
    it('reivindica via XAUTOCLAIM e processa as entradas presas', async () => {
      const { consumer, client, emitter } = criar({
        xautoclaim: jest
          .fn()
          .mockResolvedValue([
            '0-0',
            [['3-0', ['data', JSON.stringify({ nome: 'z', id: 'evt-3' })]]],
            [],
          ]),
      });
      await consumer.reivindicarPendentes();
      expect(client.xautoclaim).toHaveBeenCalled();
      expect(emitter.emit).toHaveBeenCalledWith('z', expect.objectContaining({ id: 'evt-3' }));
    });
  });

  describe('ciclo de vida', () => {
    it('onApplicationBootstrap sem REDIS_URL fica inerte (client nulo)', () => {
      const consumer = new RedisStreamConsumer(
        { get: () => undefined } as unknown as ConfigService,
        { emit: jest.fn() } as unknown as EventEmitter2,
      );
      consumer.onApplicationBootstrap();
      expect((consumer as unknown as { client: unknown }).client).toBeNull();
    });

    it('onModuleDestroy para o loop e desconecta', async () => {
      const { consumer, client } = criar();
      await consumer.onModuleDestroy();
      expect((consumer as unknown as { parando: boolean }).parando).toBe(true);
      expect(client.disconnect).toHaveBeenCalled();
    });
  });
});
