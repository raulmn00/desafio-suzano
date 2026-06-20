import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma.service';
import { Usuario } from '../../domain/usuario.entity';
import { UsuarioRepository } from '../../domain/usuario.repository';
import { UsuarioMapper } from './usuario.mapper';

@Injectable()
export class PrismaUsuarioRepository extends UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const raw = await this.prisma.client.usuario.findUnique({ where: { email } });
    return raw ? UsuarioMapper.toDomain(raw) : null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const raw = await this.prisma.client.usuario.findUnique({ where: { id } });
    return raw ? UsuarioMapper.toDomain(raw) : null;
  }
}
