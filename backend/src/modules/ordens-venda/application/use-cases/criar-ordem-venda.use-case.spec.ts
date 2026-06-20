import {
  FakeAuditLogger,
  FakeClock,
  FakeTransactionManager,
  SequentialIdGenerator,
} from '../../../../shared/testing/fakes';
import { AcaoAuditoria } from '../../../../shared/application/ports/audit-logger';
import { Cliente } from '../../../clientes/domain/cliente.entity';
import { ClienteNaoEncontradoError } from '../../../clientes/domain/cliente.errors';
import { InMemoryClienteRepository } from '../../../clientes/application/use-cases/testing/in-memory-cliente.repository';
import { Item } from '../../../itens/domain/item.entity';
import { ItemNaoEncontradoError } from '../../../itens/domain/item.errors';
import { InMemoryItemRepository } from '../../../itens/application/use-cases/testing/in-memory-item.repository';
import { TransporteNaoAutorizadoError } from '../../domain/ordem-venda.errors';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { CriarOrdemVendaUseCase } from './criar-ordem-venda.use-case';
import { InMemoryOrdemVendaRepository } from './testing/in-memory-ordem-venda.repository';

describe('CriarOrdemVendaUseCase', () => {
  const agora = new Date('2026-06-19T08:00:00.000Z');
  let clientes: InMemoryClienteRepository;
  let itens: InMemoryItemRepository;
  let ordens: InMemoryOrdemVendaRepository;
  let audit: FakeAuditLogger;
  let useCase: CriarOrdemVendaUseCase;

  beforeEach(async () => {
    clientes = new InMemoryClienteRepository();
    itens = new InMemoryItemRepository();
    ordens = new InMemoryOrdemVendaRepository();
    audit = new FakeAuditLogger();

    const cliente = Cliente.criar({ id: 'c1', nome: 'Acme', documento: '52998224725', agora });
    cliente.autorizarTransporte('t1', agora);
    await clientes.salvar(cliente);
    await itens.salvar(Item.criar({ id: 'i1', sku: 'SKU1', descricao: 'Item 1', unidade: 'UN', agora }));

    useCase = new CriarOrdemVendaUseCase(
      ordens,
      clientes,
      itens,
      new SequentialIdGenerator('ov'),
      new FakeClock(agora),
      audit,
      new FakeTransactionManager(),
    );
  });

  it('cria a OV, persiste e registra auditoria de criação', async () => {
    const view = await useCase.executar({
      clienteId: 'c1',
      tipoTransporteId: 't1',
      itens: [{ itemId: 'i1', quantidade: 2 }],
      ator: 'operador@ovgs.dev',
    });

    expect(view.status).toBe(StatusOrdemVenda.CRIADA);
    expect(ordens.itens.size).toBe(1);
    expect(audit.registros).toHaveLength(1);
    expect(audit.registros[0]).toMatchObject({
      acao: AcaoAuditoria.ORDEM_VENDA_CRIADA,
      ator: 'operador@ovgs.dev',
      estadoAnterior: null,
    });
  });

  it('rejeita quando o cliente não existe', async () => {
    await expect(
      useCase.executar({
        clienteId: 'inexistente',
        tipoTransporteId: 't1',
        itens: [{ itemId: 'i1', quantidade: 1 }],
        ator: 'op',
      }),
    ).rejects.toBeInstanceOf(ClienteNaoEncontradoError);
  });

  it('rejeita quando o transporte não está autorizado para o cliente', async () => {
    await expect(
      useCase.executar({
        clienteId: 'c1',
        tipoTransporteId: 't2',
        itens: [{ itemId: 'i1', quantidade: 1 }],
        ator: 'op',
      }),
    ).rejects.toBeInstanceOf(TransporteNaoAutorizadoError);
  });

  it('rejeita quando algum item não existe', async () => {
    await expect(
      useCase.executar({
        clienteId: 'c1',
        tipoTransporteId: 't1',
        itens: [{ itemId: 'i-inexistente', quantidade: 1 }],
        ator: 'op',
      }),
    ).rejects.toBeInstanceOf(ItemNaoEncontradoError);
  });
});
