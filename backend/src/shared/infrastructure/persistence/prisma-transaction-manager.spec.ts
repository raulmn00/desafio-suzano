import { PrismaService } from './prisma.service';
import { PrismaTransactionManager } from './prisma-transaction-manager';

describe('PrismaTransactionManager', () => {
  it('delega para PrismaService.runInTransaction e devolve o resultado', async () => {
    const runInTransaction = jest.fn(<T>(trabalho: () => Promise<T>) => trabalho());
    const prisma = { runInTransaction } as unknown as PrismaService;
    const manager = new PrismaTransactionManager(prisma);

    const resultado = await manager.executar(async () => 42);

    expect(resultado).toBe(42);
    expect(runInTransaction).toHaveBeenCalledTimes(1);
  });
});
