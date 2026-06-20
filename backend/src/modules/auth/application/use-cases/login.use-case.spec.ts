import { CredenciaisInvalidasError } from '../../domain/auth.errors';
import { PapelUsuario } from '../../domain/papel-usuario';
import { Usuario } from '../../domain/usuario.entity';
import { HashComparer } from '../ports/hash-comparer';
import { TokenGenerator } from '../ports/token-generator';
import { LoginUseCase } from './login.use-case';
import { InMemoryUsuarioRepository } from './testing/in-memory-usuario.repository';

describe('LoginUseCase', () => {
  let repositorio: InMemoryUsuarioRepository;
  let hashComparer: HashComparer;
  let tokenGenerator: TokenGenerator;
  let useCase: LoginUseCase;

  const usuarioAtivo = Usuario.restaurar({
    id: 'u1',
    email: 'op@ovgs.dev',
    nome: 'Operador',
    senhaHash: 'hash',
    papel: PapelUsuario.OPERADOR,
    ativo: true,
  });

  beforeEach(() => {
    repositorio = new InMemoryUsuarioRepository();
    hashComparer = { comparar: jest.fn().mockResolvedValue(true) };
    tokenGenerator = { gerar: jest.fn().mockReturnValue('jwt-token') };
    useCase = new LoginUseCase(repositorio, hashComparer, tokenGenerator);
  });

  it('autentica e retorna token + dados do usuário', async () => {
    repositorio.usuarios.push(usuarioAtivo);

    const saida = await useCase.executar({ email: 'op@ovgs.dev', senha: 'senha' });

    expect(saida.accessToken).toBe('jwt-token');
    expect(saida.usuario).toEqual({
      id: 'u1',
      email: 'op@ovgs.dev',
      nome: 'Operador',
      papel: PapelUsuario.OPERADOR,
    });
    expect(tokenGenerator.gerar).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'op@ovgs.dev',
      papel: PapelUsuario.OPERADOR,
    });
  });

  it('rejeita quando o usuário não existe', async () => {
    await expect(useCase.executar({ email: 'x@x.com', senha: 'a' })).rejects.toBeInstanceOf(
      CredenciaisInvalidasError,
    );
  });

  it('rejeita quando o usuário está inativo', async () => {
    repositorio.usuarios.push(
      Usuario.restaurar({
        id: 'u2',
        email: 'inativo@ovgs.dev',
        nome: 'Inativo',
        senhaHash: 'hash',
        papel: PapelUsuario.AUDITOR,
        ativo: false,
      }),
    );

    await expect(
      useCase.executar({ email: 'inativo@ovgs.dev', senha: 'senha' }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });

  it('rejeita quando a senha não confere', async () => {
    repositorio.usuarios.push(usuarioAtivo);
    (hashComparer.comparar as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.executar({ email: 'op@ovgs.dev', senha: 'errada' }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });
});
