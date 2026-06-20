import { Cliente } from '../../domain/cliente.entity';
import { ClienteNaoEncontradoError } from '../../domain/cliente.errors';
import { ConsultarClientePorIdUseCase } from './consultar-cliente-por-id.use-case';
import { ConsultarClientesUseCase } from './consultar-clientes.use-case';
import { InMemoryClienteRepository } from './testing/in-memory-cliente.repository';

describe('Consultas de Cliente', () => {
  let repositorio: InMemoryClienteRepository;

  beforeEach(async () => {
    repositorio = new InMemoryClienteRepository();
    await repositorio.salvar(
      Cliente.criar({
        id: 'c-1',
        nome: 'Acme',
        documento: '52998224725',
        agora: new Date('2026-06-19'),
      }),
    );
    await repositorio.salvar(
      Cliente.criar({
        id: 'c-2',
        nome: 'Beta',
        documento: '11222333000181',
        agora: new Date('2026-06-19'),
      }),
    );
  });

  it('lista todos os clientes', async () => {
    const lista = await new ConsultarClientesUseCase(repositorio).executar();

    expect(lista).toHaveLength(2);
    expect(lista.map((c) => c.nome)).toEqual(expect.arrayContaining(['Acme', 'Beta']));
  });

  it('consulta um cliente por id', async () => {
    const view = await new ConsultarClientePorIdUseCase(repositorio).executar('c-1');

    expect(view.nome).toBe('Acme');
  });

  it('lança NotFound ao consultar id inexistente', async () => {
    await expect(
      new ConsultarClientePorIdUseCase(repositorio).executar('x'),
    ).rejects.toBeInstanceOf(ClienteNaoEncontradoError);
  });
});
