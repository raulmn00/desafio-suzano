import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { UnauthorizedError } from '../../../../shared/domain/domain-error';
import { PapelUsuario } from '../../domain/papel-usuario';
import { Usuario } from '../../domain/usuario.entity';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator';
import { TokenGenerator } from '../ports/token-generator';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { InMemoryRefreshTokenRepository } from './testing/in-memory-refresh-token.repository';
import { InMemoryUsuarioRepository } from './testing/in-memory-usuario.repository';

const TTL = 7 * 86_400_000;
const AGORA = new Date('2026-06-20T00:00:00.000Z');

describe('RefreshTokenUseCase', () => {
  let refreshRepo: InMemoryRefreshTokenRepository;
  let usuarioRepo: InMemoryUsuarioRepository;
  let tokenGenerator: TokenGenerator;
  let opaque: OpaqueTokenGenerator;
  let idGenerator: IdGenerator;
  let clock: Clock;
  let useCase: RefreshTokenUseCase;
  let novoRefreshSeq: number;

  const usuario = Usuario.restaurar({
    id: 'u1',
    email: 'op@ovgs.dev',
    nome: 'Operador',
    senhaHash: 'hash',
    papel: PapelUsuario.OPERADOR,
    ativo: true,
  });

  beforeEach(async () => {
    refreshRepo = new InMemoryRefreshTokenRepository();
    usuarioRepo = new InMemoryUsuarioRepository();
    usuarioRepo.usuarios.push(usuario);
    tokenGenerator = { gerar: jest.fn().mockReturnValue('novo-access') };
    novoRefreshSeq = 0;
    opaque = { gerar: jest.fn(() => `novo-refresh-${(novoRefreshSeq += 1)}`) };
    idGenerator = { gerar: jest.fn(() => `id-${(novoRefreshSeq += 1)}`) };
    clock = { agora: () => AGORA };
    useCase = new RefreshTokenUseCase(
      refreshRepo,
      usuarioRepo,
      tokenGenerator,
      opaque,
      idGenerator,
      clock,
      TTL,
    );
    // emite um refresh válido inicial
    await refreshRepo.emitir({
      id: 'r1',
      usuarioId: 'u1',
      rawToken: 'refresh-atual',
      expiraEm: new Date(AGORA.getTime() + TTL),
    });
  });

  it('troca um refresh válido por novo access + novo refresh e ROTACIONA (revoga o antigo)', async () => {
    const saida = await useCase.executar({ refreshToken: 'refresh-atual' });

    expect(saida.accessToken).toBe('novo-access');
    expect(saida.refreshToken).toMatch(/^novo-refresh-/);
    // o antigo foi revogado
    const antigo = refreshRepo.tokens.find((t) => t.id === 'r1');
    expect(antigo?.revogadoEm).not.toBeNull();
    // um novo registro foi emitido
    expect(refreshRepo.tokens.length).toBe(2);
  });

  it('detecta reuso: um refresh já revogado é rejeitado (401)', async () => {
    await refreshRepo.revogar('r1');
    await expect(useCase.executar({ refreshToken: 'refresh-atual' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejeita refresh inexistente (401)', async () => {
    await expect(useCase.executar({ refreshToken: 'nao-existe' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejeita refresh expirado (401)', async () => {
    await refreshRepo.emitir({
      id: 'r2',
      usuarioId: 'u1',
      rawToken: 'expirado',
      expiraEm: new Date(AGORA.getTime() - 1),
    });
    await expect(useCase.executar({ refreshToken: 'expirado' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejeita quando o usuário foi desativado (401)', async () => {
    usuarioRepo.usuarios[0] = Usuario.restaurar({
      id: 'u1',
      email: 'op@ovgs.dev',
      nome: 'Operador',
      senhaHash: 'hash',
      papel: PapelUsuario.OPERADOR,
      ativo: false,
    });
    await expect(useCase.executar({ refreshToken: 'refresh-atual' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
