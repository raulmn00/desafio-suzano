// Mock do @prisma/client: o PrismaClient real tem estruturas internas circulares
// que quebram a serialização entre workers do Jest. Aqui só nos importa a lógica
// de propagação transacional (AsyncLocalStorage), não o client concreto.
jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    $transaction = jest.fn();
  },
}));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    // Simula uma transação real: invoca o callback com um "tx client" marcado.
    (service as unknown as { $transaction: jest.Mock }).$transaction = jest.fn(
      (fn: (tx: unknown) => unknown) => fn({ tx: true }),
    );
  });

  it('onModuleInit conecta e onModuleDestroy desconecta', async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();

    expect((service as unknown as { $connect: jest.Mock }).$connect).toHaveBeenCalledTimes(1);
    expect((service as unknown as { $disconnect: jest.Mock }).$disconnect).toHaveBeenCalledTimes(1);
  });

  it('client retorna a própria instância (raiz) fora de transação', () => {
    expect(service.client).toBe(service);
  });

  it('runInTransaction propaga o client transacional via AsyncLocalStorage', async () => {
    let clienteDentro: unknown;

    const resultado = await service.runInTransaction(async () => {
      clienteDentro = service.client;
      return 'ok';
    });

    expect(resultado).toBe('ok');
    expect(clienteDentro).toEqual({ tx: true });
  });

  it('reaproveita transação existente sem abrir uma aninhada', async () => {
    const txMock = (service as unknown as { $transaction: jest.Mock }).$transaction;

    await service.runInTransaction(async () => {
      txMock.mockClear();
      const interno = await service.runInTransaction(async () => 'interno');
      expect(interno).toBe('interno');
      expect(txMock).not.toHaveBeenCalled();
    });
  });
});
