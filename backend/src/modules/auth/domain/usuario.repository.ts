import { Usuario } from './usuario.entity';

export abstract class UsuarioRepository {
  abstract buscarPorEmail(email: string): Promise<Usuario | null>;
  abstract buscarPorId(id: string): Promise<Usuario | null>;
}
