import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import {
  EmitirRefreshTokenInput,
  RefreshTokenRepository,
  RegistroRefreshToken,
} from '../../domain/refresh-token.repository';

/** Hash determinístico do token bruto — apenas o hash é persistido. */
function hash(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class PrismaRefreshTokenRepository extends RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async emitir(input: EmitirRefreshTokenInput): Promise<void> {
    await this.prisma.client.refreshToken.create({
      data: {
        id: input.id,
        usuarioId: input.usuarioId,
        tokenHash: hash(input.rawToken),
        expiraEm: input.expiraEm,
      },
    });
  }

  async buscarPorToken(rawToken: string): Promise<RegistroRefreshToken | null> {
    const raw = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash: hash(rawToken) },
    });
    return raw
      ? { id: raw.id, usuarioId: raw.usuarioId, expiraEm: raw.expiraEm, revogadoEm: raw.revogadoEm }
      : null;
  }

  async revogar(id: string): Promise<void> {
    await this.prisma.client.refreshToken.update({
      where: { id },
      data: { revogadoEm: new Date() },
    });
  }
}
