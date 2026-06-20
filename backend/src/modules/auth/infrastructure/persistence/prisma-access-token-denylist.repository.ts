import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { AccessTokenDenylistRepository } from '../../domain/access-token-denylist.repository';

@Injectable()
export class PrismaAccessTokenDenylistRepository extends AccessTokenDenylistRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async revogar(jti: string, expiraEm: Date): Promise<void> {
    await this.prisma.client.accessTokenRevogado.upsert({
      where: { jti },
      create: { jti, expiraEm },
      update: { expiraEm },
    });
  }

  async estaRevogado(jti: string): Promise<boolean> {
    const registro = await this.prisma.client.accessTokenRevogado.findUnique({ where: { jti } });
    return registro !== null;
  }
}
