import { FakeClock } from '../../../../shared/testing/fakes';
import { Cliente } from '../../domain/cliente.entity';
import {
  ClienteNaoEncontradoError,
  DocumentoJaCadastradoError,
} from '../../domain/cliente.errors';
import { EditarClienteUseCase } from './editar-cliente.use-case';
import { InMemoryClienteRepository } from './testing/in-memory-cliente.repository';

describe('EditarClienteUseCase', () => {
  let repositorio: InMemoryClienteRepository;
  let useCase: EditarClienteUseCase;

  beforeEach(async () => {
    repositorio = new InMemoryClienteRepository();
    useCase = new EditarClienteUseCase(repositorio, new FakeClock());
    await repositorio.salvar(
      Cliente.criar({ id: 'c-1', nome: 'Acme', documento: '52998224725', agora: new Date('2026-06-19') }),
    );
  });

  it('edita o nome do cliente', async () => {
    const view = await useCase.executar({ id: 'c-1', nome: 'Acme S.A.' });

    expect(view.nome).toBe('Acme S.A.');
  });

  it('mantém o mesmo documento sem acusar conflito', async () => {
    const view = await useCase.executar({ id: 'c-1', documento: '529.982.247-25' });

    expect(view.documento).toBe('52998224725');
  });

  it('lança NotFound para id inexistente', async () => {
    await expect(useCase.executar({ id: 'x', nome: 'Y' })).rejects.toBeInstanceOf(
      ClienteNaoEncontradoError,
    );
  });

  it('lança conflito quando o novo documento pertence a outro cliente', async () => {
    await repositorio.salvar(
      Cliente.criar({ id: 'c-2', nome: 'Beta', documento: '11222333000181', agora: new Date('2026-06-19') }),
    );

    await expect(
      useCase.executar({ id: 'c-1', documento: '11.222.333/0001-81' }),
    ).rejects.toBeInstanceOf(DocumentoJaCadastradoError);
  });
});
