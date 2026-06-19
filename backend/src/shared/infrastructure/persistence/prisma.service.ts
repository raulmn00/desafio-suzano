import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

type TxClient = Prisma.TransactionClient;

/**
 * PrismaService com contexto transacional propagado via AsyncLocalStorage.
 *
 * Repositórios e o audit logger leem `prisma.client` — que devolve o client
 * transacional quando há uma transação em andamento, ou o client raiz caso
 * contrário. Assim, `TransactionManager.executar` torna repositório + auditoria
 * atômicos sem que nenhuma camada acima da infraestrutura saiba disso.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly als = new AsyncLocalStorage<TxClient>();

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Client ativo: o transacional (dentro de uma transação) ou a raiz. */
  get client(): TxClient {
    return this.als.getStore() ?? (this as unknown as TxClient);
  }

  /**
   * Executa `trabalho` dentro de uma transação. Se já houver uma transação
   * ativa, reaproveita (não abre transação aninhada).
   */
  async runInTransaction<T>(trabalho: () => Promise<T>): Promise<T> {
    if (this.als.getStore()) {
      return trabalho();
    }
    return this.$transaction((tx) => this.als.run(tx as TxClient, trabalho));
  }
}
