import { DomainValidationError } from '../../../../shared/domain/domain-error';
import { FakeClock, SequentialIdGenerator } from '../../../../shared/testing/fakes';
import { DocumentoJaCadastradoError } from '../../domain/cliente.errors';
import { CriarClienteUseCase } from './criar-cliente.use-case';
import { InMemoryClienteRepository } from './testing/in-memory-cliente.repository';

describe('CriarClienteUseCase', () => {
  let repositorio: InMemoryClienteRepository;
  let useCase: CriarClienteUseCase;

  beforeEach(() => {
    repositorio = new InMemoryClienteRepository();
    useCase = new CriarClienteUseCase(repositorio, new SequentialIdGenerator('c'), new FakeClock());
  });

  it('cria um cliente sem transportes autorizados', async () => {
    const view = await useCase.executar({ nome: 'Acme', documento: '529.982.247-25' });

    expect(view).toMatchObject({ id: 'c-1', nome: 'Acme', documento: '52998224725', ativo: true });
    expect(view.transportesAutorizados).toEqual([]);
    expect(repositorio.itens.size).toBe(1);
  });

  it('rejeita documento já cadastrado (comparando normalizado)', async () => {
    await useCase.executar({ nome: 'Acme', documento: '52998224725' });

    await expect(
      useCase.executar({ nome: 'Outro', documento: '529.982.247-25' }),
    ).rejects.toBeInstanceOf(DocumentoJaCadastradoError);
    expect(repositorio.itens.size).toBe(1);
  });

  it('propaga erro de validação para documento inválido', async () => {
    await expect(useCase.executar({ nome: 'Acme', documento: '123' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
  });
});
