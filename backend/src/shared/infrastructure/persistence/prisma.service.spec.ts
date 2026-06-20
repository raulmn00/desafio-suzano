// Mock do @prisma/client: o PrismaClient real é um Proxy com estruturas internas
// circulares que quebram a serialização entre workers do Jest. Aqui só nos
// importa a lógica de propagação transacional (AsyncLocalStorage).
jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    $transaction = jest.fn();
  },
  Prisma: {},
}));

import { PrismaService } from './prisma.service';

interface ClientInterno {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
}

describe('PrismaService', () => {
  let service: PrismaService;
  let interno: ClientInterno;

  beforeEach(() => {
    service = new PrismaService();
    interno = (service as unknown as { prisma: ClientInterno }).prisma;
    interno.$transaction = jest.fn((fn: (tx: unknown) => unknown) => fn({ tx: true }));
  });

  it('onModuleInit conecta e onModuleDestroy desconecta', async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(interno.$connect).toHaveBeenCalledTimes(1);
    expect(interno.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('client retorna o PrismaClient interno fora de transação', () => {
    expect(service.client).toBe(interno);
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
    await service.runInTransaction(async () => {
      interno.$transaction.mockClear();
      const internoResultado = await service.runInTransaction(async () => 'interno');
      expect(internoResultado).toBe('interno');
      expect(interno.$transaction).not.toHaveBeenCalled();
    });
  });
});
