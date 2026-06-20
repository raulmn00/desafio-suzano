import { Usuario } from '../../../domain/usuario.entity';
import { UsuarioRepository } from '../../../domain/usuario.repository';

export class InMemoryUsuarioRepository extends UsuarioRepository {
  readonly usuarios: Usuario[] = [];

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }
}
