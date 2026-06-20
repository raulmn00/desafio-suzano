import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import { OrdemVendaNaoEncontradaError } from '../../domain/ordem-venda.errors';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { ConsultarOrdemPorIdUseCase } from './consultar-ordem-por-id.use-case';
import { ConsultarOrdensUseCase } from './consultar-ordens.use-case';
import { InMemoryOrdemVendaRepository } from './testing/in-memory-ordem-venda.repository';

function ordem(
  id: string,
  status: StatusOrdemVenda,
  clienteId: string,
  tipoTransporteId: string,
  criadoEm: Date,
): OrdemDeVenda {
  return OrdemDeVenda.restaurar({
    id,
    clienteId,
    tipoTransporteId,
    status,
    itens: [{ itemId: 'i1', quantidade: 1 }],
    agendamento: null,
    criadoEm,
    atualizadoEm: criadoEm,
  });
}

describe('Consultas de Ordem de Venda', () => {
  let repositorio: InMemoryOrdemVendaRepository;

  beforeEach(async () => {
    repositorio = new InMemoryOrdemVendaRepository();
    await repositorio.salvar(
      ordem('o1', StatusOrdemVenda.CRIADA, 'c1', 't1', new Date('2026-06-10')),
    );
    await repositorio.salvar(
      ordem('o2', StatusOrdemVenda.PLANEJADA, 'c1', 't2', new Date('2026-06-15')),
    );
    await repositorio.salvar(
      ordem('o3', StatusOrdemVenda.CRIADA, 'c2', 't1', new Date('2026-06-20')),
    );
  });

  it('lista todas sem filtros', async () => {
    const lista = await new ConsultarOrdensUseCase(repositorio).executar({});
    expect(lista).toHaveLength(3);
  });

  it('filtra por status', async () => {
    const lista = await new ConsultarOrdensUseCase(repositorio).executar({
      status: StatusOrdemVenda.CRIADA,
    });
    expect(lista.map((o) => o.id).sort()).toEqual(['o1', 'o3']);
  });

  it('filtra por cliente', async () => {
    const lista = await new ConsultarOrdensUseCase(repositorio).executar({ clienteId: 'c1' });
    expect(lista.map((o) => o.id).sort()).toEqual(['o1', 'o2']);
  });

  it('filtra por tipo de transporte', async () => {
    const lista = await new ConsultarOrdensUseCase(repositorio).executar({
      tipoTransporteId: 't2',
    });
    expect(lista.map((o) => o.id)).toEqual(['o2']);
  });

  it('filtra por período (criadoDe/criadoAte)', async () => {
    const lista = await new ConsultarOrdensUseCase(repositorio).executar({
      criadoDe: new Date('2026-06-12'),
      criadoAte: new Date('2026-06-18'),
    });
    expect(lista.map((o) => o.id)).toEqual(['o2']);
  });

  it('consulta por id', async () => {
    const view = await new ConsultarOrdemPorIdUseCase(repositorio).executar('o1');
    expect(view.id).toBe('o1');
  });

  it('lança NotFound ao consultar id inexistente', async () => {
    await expect(new ConsultarOrdemPorIdUseCase(repositorio).executar('x')).rejects.toBeInstanceOf(
      OrdemVendaNaoEncontradaError,
    );
  });
});
