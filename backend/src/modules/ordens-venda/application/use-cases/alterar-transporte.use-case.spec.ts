import { AcaoAuditoria } from '../../../../shared/application/ports/audit-logger';
import { FakeAuditLogger, FakeClock, FakeTransactionManager } from '../../../../shared/testing/fakes';
import { Cliente } from '../../../clientes/domain/cliente.entity';
import { ClienteNaoEncontradoError } from '../../../clientes/domain/cliente.errors';
import { InMemoryClienteRepository } from '../../../clientes/application/use-cases/testing/in-memory-cliente.repository';
import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import {
  OrdemVendaNaoEncontradaError,
  TransporteNaoAutorizadoError,
} from '../../domain/ordem-venda.errors';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { AlterarTransporteUseCase } from './alterar-transporte.use-case';
import { InMemoryOrdemVendaRepository } from './testing/in-memory-ordem-venda.repository';

describe('AlterarTransporteUseCase', () => {
  const agora = new Date('2026-06-19T08:00:00.000Z');
  let ordens: InMemoryOrdemVendaRepository;
  let clientes: InMemoryClienteRepository;
  let audit: FakeAuditLogger;
  let useCase: AlterarTransporteUseCase;

  const seedOrdem = async (clienteId: string) => {
    await ordens.salvar(
      OrdemDeVenda.restaurar({
        id: 'o1',
        clienteId,
        tipoTransporteId: 't1',
        status: StatusOrdemVenda.CRIADA,
        itens: [{ itemId: 'i1', quantidade: 1 }],
        agendamento: null,
        criadoEm: agora,
        atualizadoEm: agora,
      }),
    );
  };

  beforeEach(async () => {
    ordens = new InMemoryOrdemVendaRepository();
    clientes = new InMemoryClienteRepository();
    audit = new FakeAuditLogger();
    const cliente = Cliente.criar({ id: 'c1', nome: 'Acme', documento: '52998224725', agora });
    cliente.autorizarTransporte('t2', agora);
    await clientes.salvar(cliente);
    useCase = new AlterarTransporteUseCase(
      ordens,
      clientes,
      new FakeClock(agora),
      audit,
      new FakeTransactionManager(),
    );
  });

  it('altera o transporte para um autorizado e audita', async () => {
    await seedOrdem('c1');

    const view = await useCase.executar({ id: 'o1', tipoTransporteId: 't2', ator: 'op' });

    expect(view.tipoTransporteId).toBe('t2');
    expect(audit.registros[0].acao).toBe(AcaoAuditoria.ORDEM_VENDA_TRANSPORTE_ALTERADO);
  });

  it('lança NotFound quando a ordem não existe', async () => {
    await expect(
      useCase.executar({ id: 'x', tipoTransporteId: 't2', ator: 'op' }),
    ).rejects.toBeInstanceOf(OrdemVendaNaoEncontradaError);
  });

  it('lança ClienteNaoEncontrado quando o cliente da ordem não existe', async () => {
    await seedOrdem('c-removido');

    await expect(
      useCase.executar({ id: 'o1', tipoTransporteId: 't2', ator: 'op' }),
    ).rejects.toBeInstanceOf(ClienteNaoEncontradoError);
  });

  it('rejeita transporte não autorizado para o cliente', async () => {
    await seedOrdem('c1');

    await expect(
      useCase.executar({ id: 'o1', tipoTransporteId: 't9', ator: 'op' }),
    ).rejects.toBeInstanceOf(TransporteNaoAutorizadoError);
  });
});
