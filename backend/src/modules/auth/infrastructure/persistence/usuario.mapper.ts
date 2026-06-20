import { Usuario as UsuarioPrisma } from '@prisma/client';
import { PapelUsuario } from '../../domain/papel-usuario';
import { Usuario } from '../../domain/usuario.entity';

export class UsuarioMapper {
  static toDomain(raw: UsuarioPrisma): Usuario {
    return Usuario.restaurar({
      id: raw.id,
      email: raw.email,
      nome: raw.nome,
      senhaHash: raw.senhaHash,
      papel: raw.papel as PapelUsuario,
      ativo: raw.ativo,
    });
  }
}
