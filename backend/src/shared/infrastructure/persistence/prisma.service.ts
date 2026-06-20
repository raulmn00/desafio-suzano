import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

type TxClient = Prisma.TransactionClient;

/**
 * PrismaService com contexto transacional propagado via AsyncLocalStorage.
 *
 * Usa COMPOSIÇÃO (contém um PrismaClient) em vez de herança: o PrismaClient do
 * Prisma é um Proxy, e estendê-lo faz `this` cair no target interno (sem os
 * delegates de modelo). Compondo, `client` devolve o próprio Proxy (com os
 * modelos) ou o client transacional quando há transação ativa.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly prisma = new PrismaClient();
  private readonly als = new AsyncLocalStorage<TxClient>();

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /** Client ativo: o transacional (dentro de uma transação) ou a raiz. */
  get client(): TxClient {
    return this.als.getStore() ?? this.prisma;
  }

  /**
   * Executa `trabalho` dentro de uma transação. Se já houver uma transação
   * ativa, reaproveita (não abre transação aninhada).
   */
  async runInTransaction<T>(trabalho: () => Promise<T>): Promise<T> {
    if (this.als.getStore()) {
      return trabalho();
    }
    return this.prisma.$transaction((tx) => this.als.run(tx as TxClient, trabalho));
  }
}
