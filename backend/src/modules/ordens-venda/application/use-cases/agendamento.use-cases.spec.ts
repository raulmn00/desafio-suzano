import { AcaoAuditoria } from '../../../../shared/application/ports/audit-logger';
import {
  FakeAuditLogger,
  FakeClock,
  FakeTransactionManager,
} from '../../../../shared/testing/fakes';
import { OrdemDeVenda, Agendamento } from '../../domain/ordem-venda.entity';
import { OrdemVendaNaoEncontradaError } from '../../domain/ordem-venda.errors';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { ConfirmarAgendamentoUseCase } from './confirmar-agendamento.use-case';
import { DefinirAgendamentoUseCase } from './definir-agendamento.use-case';
import { ReagendarUseCase } from './reagendar.use-case';
import { InMemoryOrdemVendaRepository } from './testing/in-memory-ordem-venda.repository';

const agora = new Date('2026-06-19T08:00:00.000Z');
const dataEntrega = new Date('2026-06-25T00:00:00.000Z');

function ordemEm(status: StatusOrdemVenda, agendamento: Agendamento | null = null): OrdemDeVenda {
  return OrdemDeVenda.restaurar({
    id: 'o1',
    clienteId: 'c1',
    tipoTransporteId: 't1',
    status,
    itens: [{ itemId: 'i1', quantidade: 1 }],
    agendamento,
    criadoEm: agora,
    atualizadoEm: agora,
  });
}

describe('Central de Agendamento (use-cases)', () => {
  let repositorio: InMemoryOrdemVendaRepository;
  let audit: FakeAuditLogger;

  beforeEach(() => {
    repositorio = new InMemoryOrdemVendaRepository();
    audit = new FakeAuditLogger();
  });

  describe('DefinirAgendamento', () => {
    const useCase = () =>
      new DefinirAgendamentoUseCase(
        repositorio,
        new FakeClock(agora),
        audit,
        new FakeTransactionManager(),
      );

    it('define o agendamento e audita', async () => {
      await repositorio.salvar(ordemEm(StatusOrdemVenda.PLANEJADA));

      const view = await useCase().executar({
        id: 'o1',
        dataEntrega,
        janelaInicio: '08:00',
        janelaFim: '12:00',
        ator: 'op',
      });

      expect(view.agendamento).toMatchObject({ janelaInicio: '08:00', confirmado: false });
      expect(audit.registros[0].acao).toBe(AcaoAuditoria.ORDEM_VENDA_AGENDAMENTO_DEFINIDO);
    });

    it('lança NotFound', async () => {
      await expect(
        useCase().executar({
          id: 'x',
          dataEntrega,
          janelaInicio: '08:00',
          janelaFim: '12:00',
          ator: 'op',
        }),
      ).rejects.toBeInstanceOf(OrdemVendaNaoEncontradaError);
    });
  });

  describe('ConfirmarAgendamento', () => {
    const useCase = () =>
      new ConfirmarAgendamentoUseCase(
        repositorio,
        new FakeClock(agora),
        audit,
        new FakeTransactionManager(),
      );

    it('confirma o agendamento e audita', async () => {
      await repositorio.salvar(
        ordemEm(StatusOrdemVenda.PLANEJADA, {
          dataEntrega,
          janelaInicio: '08:00',
          janelaFim: '12:00',
          confirmado: false,
        }),
      );

      const view = await useCase().executar({ id: 'o1', ator: 'op' });

      expect(view.agendamento?.confirmado).toBe(true);
      expect(audit.registros[0].acao).toBe(AcaoAuditoria.ORDEM_VENDA_AGENDAMENTO_CONFIRMADO);
    });

    it('lança NotFound', async () => {
      await expect(useCase().executar({ id: 'x', ator: 'op' })).rejects.toBeInstanceOf(
        OrdemVendaNaoEncontradaError,
      );
    });
  });

  describe('Reagendar', () => {
    const useCase = () =>
      new ReagendarUseCase(repositorio, new FakeClock(agora), audit, new FakeTransactionManager());

    it('reagenda (volta a não confirmado) e audita', async () => {
      await repositorio.salvar(
        ordemEm(StatusOrdemVenda.AGENDADA, {
          dataEntrega,
          janelaInicio: '08:00',
          janelaFim: '12:00',
          confirmado: true,
        }),
      );

      const view = await useCase().executar({
        id: 'o1',
        dataEntrega,
        janelaInicio: '13:00',
        janelaFim: '17:00',
        ator: 'op',
      });

      expect(view.agendamento).toMatchObject({ janelaInicio: '13:00', confirmado: false });
      expect(audit.registros[0].acao).toBe(AcaoAuditoria.ORDEM_VENDA_REAGENDADA);
    });

    it('lança NotFound', async () => {
      await expect(
        useCase().executar({
          id: 'x',
          dataEntrega,
          janelaInicio: '13:00',
          janelaFim: '17:00',
          ator: 'op',
        }),
      ).rejects.toBeInstanceOf(OrdemVendaNaoEncontradaError);
    });
  });
});
