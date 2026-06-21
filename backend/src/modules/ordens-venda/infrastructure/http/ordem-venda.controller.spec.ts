import { AlterarTransporteUseCase } from '../../application/use-cases/alterar-transporte.use-case';
import { AtualizarStatusUseCase } from '../../application/use-cases/atualizar-status.use-case';
import { ConsultarOrdemPorIdUseCase } from '../../application/use-cases/consultar-ordem-por-id.use-case';
import { ConsultarOrdensUseCase } from '../../application/use-cases/consultar-ordens.use-case';
import { CriarOrdemVendaUseCase } from '../../application/use-cases/criar-ordem-venda.use-case';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { OrdemVendaController } from './ordem-venda.controller';

describe('OrdemVendaController', () => {
  const criar = { executar: jest.fn() } as unknown as CriarOrdemVendaUseCase;
  const consultar = { executar: jest.fn() } as unknown as ConsultarOrdensUseCase;
  const porId = { executar: jest.fn() } as unknown as ConsultarOrdemPorIdUseCase;
  const status = { executar: jest.fn() } as unknown as AtualizarStatusUseCase;
  const transporte = { executar: jest.fn() } as unknown as AlterarTransporteUseCase;
  const controller = new OrdemVendaController(criar, consultar, porId, status, transporte);

  afterEach(() => jest.clearAllMocks());

  it('criar repassa o DTO e o ator', async () => {
    const dto = {
      clienteId: 'c1',
      tipoTransporteId: 't1',
      itens: [{ itemId: 'i1', quantidade: 1 }],
    };
    await controller.criar(dto, 'op@ovgs.dev');
    expect(criar.executar).toHaveBeenCalledWith({ ...dto, ator: 'op@ovgs.dev' });
  });

  it('listar converte datas dos filtros para Date e repassa paginação', async () => {
    await controller.listar({
      status: StatusOrdemVenda.CRIADA,
      clienteId: 'c1',
      tipoTransporteId: 't1',
      criadoDe: '2026-06-01',
      criadoAte: '2026-06-30',
      page: 2,
      limit: 5,
    });
    expect(consultar.executar).toHaveBeenCalledWith(
      {
        status: StatusOrdemVenda.CRIADA,
        clienteId: 'c1',
        tipoTransporteId: 't1',
        criadoDe: new Date('2026-06-01'),
        criadoAte: new Date('2026-06-30'),
      },
      { page: 2, limit: 5 },
    );
  });

  it('listar sem datas envia undefined e paginação default', async () => {
    await controller.listar({});
    expect(consultar.executar).toHaveBeenCalledWith(
      {
        status: undefined,
        clienteId: undefined,
        tipoTransporteId: undefined,
        criadoDe: undefined,
        criadoAte: undefined,
      },
      { page: 1, limit: 20 },
    );
  });

  it('obter repassa o id', async () => {
    await controller.obter('o1');
    expect(porId.executar).toHaveBeenCalledWith('o1');
  });

  it('atualizarStatus repassa id, status e ator', async () => {
    await controller.atualizarStatus('o1', { status: StatusOrdemVenda.PLANEJADA }, 'op');
    expect(status.executar).toHaveBeenCalledWith({
      id: 'o1',
      status: StatusOrdemVenda.PLANEJADA,
      ator: 'op',
    });
  });

  it('alterarTransporte repassa os dados', async () => {
    await controller.alterarTransporte('o1', { tipoTransporteId: 't2' }, 'op');
    expect(transporte.executar).toHaveBeenCalledWith({
      id: 'o1',
      tipoTransporteId: 't2',
      ator: 'op',
    });
  });
});
