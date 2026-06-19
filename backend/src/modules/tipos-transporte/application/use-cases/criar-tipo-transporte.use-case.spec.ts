import { DomainValidationError } from '../../../../shared/domain/domain-error';
import { FakeClock, SequentialIdGenerator } from '../../../../shared/testing/fakes';
import { CodigoTransporteJaCadastradoError } from '../../domain/tipo-transporte.errors';
import { CriarTipoTransporteUseCase } from './criar-tipo-transporte.use-case';
import { InMemoryTipoTransporteRepository } from './testing/in-memory-tipo-transporte.repository';

describe('CriarTipoTransporteUseCase', () => {
  let repositorio: InMemoryTipoTransporteRepository;
  let useCase: CriarTipoTransporteUseCase;

  beforeEach(() => {
    repositorio = new InMemoryTipoTransporteRepository();
    useCase = new CriarTipoTransporteUseCase(
      repositorio,
      new SequentialIdGenerator('tt'),
      new FakeClock(new Date('2026-06-19T12:00:00.000Z')),
    );
  });

  it('cria um tipo de transporte e o persiste', async () => {
    const view = await useCase.executar({ nome: 'Caminhão', codigo: 'cam' });

    expect(view).toMatchObject({ id: 'tt-1', nome: 'Caminhão', codigo: 'CAM', ativo: true });
    expect(repositorio.itens.size).toBe(1);
    expect((await repositorio.buscarPorCodigo('CAM'))?.id).toBe('tt-1');
  });

  it('rejeita código já cadastrado', async () => {
    await useCase.executar({ nome: 'Caminhão', codigo: 'CAM' });

    await expect(useCase.executar({ nome: 'Outro', codigo: 'cam' })).rejects.toBeInstanceOf(
      CodigoTransporteJaCadastradoError,
    );
    expect(repositorio.itens.size).toBe(1);
  });

  it('propaga erro de validação de domínio para nome inválido', async () => {
    await expect(useCase.executar({ nome: '   ', codigo: 'CAM' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repositorio.itens.size).toBe(0);
  });
});
