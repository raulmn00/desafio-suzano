import { Injectable } from '@nestjs/common';
import { TransactionManager } from '../../application/ports/transaction-manager';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionManager extends TransactionManager {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  executar<T>(trabalho: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(trabalho);
  }
}
