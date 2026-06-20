import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { CredenciaisInvalidasError } from '../../domain/auth.errors';
import { PapelUsuario } from '../../domain/papel-usuario';
import { Usuario } from '../../domain/usuario.entity';
import { HashComparer } from '../ports/hash-comparer';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator';
import { TokenGenerator } from '../ports/token-generator';
import { LoginUseCase } from './login.use-case';
import { InMemoryRefreshTokenRepository } from './testing/in-memory-refresh-token.repository';
import { InMemoryUsuarioRepository } from './testing/in-memory-usuario.repository';

const REFRESH_TTL_MS = 7 * 86_400_000;

describe('LoginUseCase', () => {
  let repositorio: InMemoryUsuarioRepository;
  let refreshRepo: InMemoryRefreshTokenRepository;
  let hashComparer: HashComparer;
  let tokenGenerator: TokenGenerator;
  let opaque: OpaqueTokenGenerator;
  let idGenerator: IdGenerator;
  let clock: Clock;
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
    refreshRepo = new InMemoryRefreshTokenRepository();
    hashComparer = { comparar: jest.fn().mockResolvedValue(true) };
    tokenGenerator = { gerar: jest.fn().mockReturnValue('jwt-token') };
    opaque = { gerar: jest.fn().mockReturnValue('refresh-bruto') };
    idGenerator = { gerar: jest.fn().mockReturnValue('id-fixo') };
    clock = { agora: () => new Date('2026-06-20T00:00:00.000Z') };
    useCase = new LoginUseCase(
      repositorio,
      hashComparer,
      tokenGenerator,
      refreshRepo,
      opaque,
      idGenerator,
      clock,
      REFRESH_TTL_MS,
    );
  });

  it('autentica e retorna access token (com jti), refresh token e dados do usuário', async () => {
    repositorio.usuarios.push(usuarioAtivo);

    const saida = await useCase.executar({ email: 'op@ovgs.dev', senha: 'senha' });

    expect(saida.accessToken).toBe('jwt-token');
    expect(saida.refreshToken).toBe('refresh-bruto');
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
      jti: 'id-fixo',
    });
  });

  it('persiste o refresh token com expiração = agora + TTL', async () => {
    repositorio.usuarios.push(usuarioAtivo);
    await useCase.executar({ email: 'op@ovgs.dev', senha: 'senha' });

    expect(refreshRepo.tokens).toHaveLength(1);
    expect(refreshRepo.tokens[0].usuarioId).toBe('u1');
    expect(refreshRepo.tokens[0].expiraEm.toISOString()).toBe('2026-06-27T00:00:00.000Z');
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
