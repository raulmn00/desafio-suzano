import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/persistence/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('readiness → ready quando o banco responde', async () => {
    const prisma = {
      client: { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) },
    } as unknown as PrismaService;
    await expect(new HealthService(prisma).readiness()).resolves.toMatchObject({ status: 'ready' });
  });

  it('readiness → 503 (ServiceUnavailable) quando o banco falha', async () => {
    const prisma = {
      client: { $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')) },
    } as unknown as PrismaService;
    await expect(new HealthService(prisma).readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
