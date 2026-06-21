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

  it('lista todas sem filtros (envelope paginado)', async () => {
    const r = await new ConsultarOrdensUseCase(repositorio).executar({});
    expect(r.data).toHaveLength(3);
    expect(r).toMatchObject({ page: 1, limit: 20, total: 3, totalPages: 1 });
  });

  it('pagina: limit aplica skip/take e total reflete o conjunto filtrado', async () => {
    const uc = new ConsultarOrdensUseCase(repositorio);
    const p1 = await uc.executar({}, { page: 1, limit: 2 });
    expect(p1.data).toHaveLength(2);
    expect(p1).toMatchObject({ total: 3, totalPages: 2 });
    const p2 = await uc.executar({}, { page: 2, limit: 2 });
    expect(p2.data).toHaveLength(1);
  });

  it('filtra por status', async () => {
    const { data } = await new ConsultarOrdensUseCase(repositorio).executar({
      status: StatusOrdemVenda.CRIADA,
    });
    expect(data.map((o) => o.id).sort()).toEqual(['o1', 'o3']);
  });

  it('filtra por cliente', async () => {
    const { data } = await new ConsultarOrdensUseCase(repositorio).executar({ clienteId: 'c1' });
    expect(data.map((o) => o.id).sort()).toEqual(['o1', 'o2']);
  });

  it('filtra por tipo de transporte', async () => {
    const { data } = await new ConsultarOrdensUseCase(repositorio).executar({
      tipoTransporteId: 't2',
    });
    expect(data.map((o) => o.id)).toEqual(['o2']);
  });

  it('filtra por período (criadoDe/criadoAte)', async () => {
    const { data } = await new ConsultarOrdensUseCase(repositorio).executar({
      criadoDe: new Date('2026-06-12'),
      criadoAte: new Date('2026-06-18'),
    });
    expect(data.map((o) => o.id)).toEqual(['o2']);
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
