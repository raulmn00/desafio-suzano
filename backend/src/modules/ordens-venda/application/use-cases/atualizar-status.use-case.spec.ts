import { AcaoAuditoria } from '../../../../shared/application/ports/audit-logger';
import {
  FakeAuditLogger,
  FakeClock,
  FakeEventPublisher,
  FakeTransactionManager,
} from '../../../../shared/testing/fakes';
import { OrdemDeVenda } from '../../domain/ordem-venda.entity';
import { OrdemVendaStatusAlteradoEvent } from '../../domain/events/ordem-venda.events';
import { OrdemVendaNaoEncontradaError } from '../../domain/ordem-venda.errors';
import { StatusOrdemVenda, TransicaoInvalidaError } from '../../domain/status-ordem-venda';
import { AtualizarStatusUseCase } from './atualizar-status.use-case';
import { InMemoryOrdemVendaRepository } from './testing/in-memory-ordem-venda.repository';

describe('AtualizarStatusUseCase', () => {
  const agora = new Date('2026-06-19T08:00:00.000Z');
  let repositorio: InMemoryOrdemVendaRepository;
  let audit: FakeAuditLogger;
  let events: FakeEventPublisher;
  let useCase: AtualizarStatusUseCase;

  beforeEach(async () => {
    repositorio = new InMemoryOrdemVendaRepository();
    audit = new FakeAuditLogger();
    events = new FakeEventPublisher();
    await repositorio.salvar(
      OrdemDeVenda.restaurar({
        id: 'o1',
        clienteId: 'c1',
        tipoTransporteId: 't1',
        status: StatusOrdemVenda.CRIADA,
        itens: [{ itemId: 'i1', quantidade: 1 }],
        agendamento: null,
        criadoEm: agora,
        atualizadoEm: agora,
      }),
    );
    useCase = new AtualizarStatusUseCase(
      repositorio,
      new FakeClock(agora),
      audit,
      new FakeTransactionManager(),
      events,
    );
  });

  it('avança o status e registra a auditoria com estado antes/depois', async () => {
    const view = await useCase.executar({
      id: 'o1',
      status: StatusOrdemVenda.PLANEJADA,
      ator: 'op',
    });

    expect(view.status).toBe(StatusOrdemVenda.PLANEJADA);
    expect(audit.registros[0]).toMatchObject({
      acao: AcaoAuditoria.ORDEM_VENDA_STATUS_ALTERADO,
      estadoAnterior: { status: StatusOrdemVenda.CRIADA },
      estadoPosterior: { status: StatusOrdemVenda.PLANEJADA },
    });
  });

  it('publica OrdemVendaStatusAlteradoEvent com de/para após a transição', async () => {
    await useCase.executar({ id: 'o1', status: StatusOrdemVenda.PLANEJADA, ator: 'op' });

    expect(events.eventos).toHaveLength(1);
    expect(events.eventos[0]).toBeInstanceOf(OrdemVendaStatusAlteradoEvent);
    expect(events.eventos[0]).toMatchObject({
      ordemId: 'o1',
      de: StatusOrdemVenda.CRIADA,
      para: StatusOrdemVenda.PLANEJADA,
    });
  });

  it('lança NotFound para ordem inexistente', async () => {
    await expect(
      useCase.executar({ id: 'x', status: StatusOrdemVenda.PLANEJADA, ator: 'op' }),
    ).rejects.toBeInstanceOf(OrdemVendaNaoEncontradaError);
  });

  it('propaga transição inválida sem auditar', async () => {
    await expect(
      useCase.executar({ id: 'o1', status: StatusOrdemVenda.AGENDADA, ator: 'op' }),
    ).rejects.toBeInstanceOf(TransicaoInvalidaError);
    expect(audit.registros).toHaveLength(0);
  });
});
