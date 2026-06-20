import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/persistence/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Readiness: a API só está pronta para tráfego se o banco responde. Faz um
   * `SELECT 1`; em falha, responde 503 (o orquestrador tira a instância do LB).
   */
  async readiness(): Promise<{ status: 'ready'; timestamp: string }> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
