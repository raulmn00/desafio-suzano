import { OrdemDeVenda } from './ordem-venda.entity';
import {
  AgendamentoInexistenteError,
  AgendamentoInvalidoError,
  AgendamentoNaoConfirmadoError,
  ItemDuplicadoNaOrdemError,
  OperacaoInvalidaParaStatusError,
  OrdemSemItensError,
  QuantidadeInvalidaError,
} from './ordem-venda.errors';
import { StatusOrdemVenda, TransicaoInvalidaError } from './status-ordem-venda';

const agora = new Date('2026-06-19T08:00:00.000Z');
const dataEntrega = new Date('2026-06-25T00:00:00.000Z');

function novaOrdem(): OrdemDeVenda {
  return OrdemDeVenda.criar({
    id: 'ov1',
    clienteId: 'c1',
    tipoTransporteId: 't1',
    itens: [{ itemId: 'i1', quantidade: 2 }],
    agora,
  });
}

function ordemPlanejada(): OrdemDeVenda {
  const ordem = novaOrdem();
  ordem.transicionarPara(StatusOrdemVenda.PLANEJADA, agora);
  return ordem;
}

function ordemAgendada(): OrdemDeVenda {
  const ordem = ordemPlanejada();
  ordem.definirAgendamento({ dataEntrega, janelaInicio: '08:00', janelaFim: '12:00' }, agora);
  ordem.confirmarAgendamento(agora);
  ordem.transicionarPara(StatusOrdemVenda.AGENDADA, agora);
  return ordem;
}

describe('OrdemDeVenda (domínio)', () => {
  describe('criar', () => {
    it('cria no status CRIADA com itens copiados', () => {
      const ordem = novaOrdem();

      expect(ordem.status).toBe(StatusOrdemVenda.CRIADA);
      expect(ordem.itens).toEqual([{ itemId: 'i1', quantidade: 2 }]);
      expect(ordem.agendamento).toBeNull();
    });

    it('rejeita ordem sem itens', () => {
      expect(() =>
        OrdemDeVenda.criar({
          id: 'ov1',
          clienteId: 'c1',
          tipoTransporteId: 't1',
          itens: [],
          agora,
        }),
      ).toThrow(OrdemSemItensError);
    });

    it('rejeita quantidade <= 0', () => {
      expect(() =>
        OrdemDeVenda.criar({
          id: 'ov1',
          clienteId: 'c1',
          tipoTransporteId: 't1',
          itens: [{ itemId: 'i1', quantidade: 0 }],
          agora,
        }),
      ).toThrow(QuantidadeInvalidaError);
    });

    it('rejeita itens duplicados', () => {
      expect(() =>
        OrdemDeVenda.criar({
          id: 'ov1',
          clienteId: 'c1',
          tipoTransporteId: 't1',
          itens: [
            { itemId: 'i1', quantidade: 1 },
            { itemId: 'i1', quantidade: 2 },
          ],
          agora,
        }),
      ).toThrow(ItemDuplicadoNaOrdemError);
    });
  });

  describe('transicionarPara', () => {
    it('avança CRIADA → PLANEJADA', () => {
      const ordem = novaOrdem();
      ordem.transicionarPara(StatusOrdemVenda.PLANEJADA, agora);
      expect(ordem.status).toBe(StatusOrdemVenda.PLANEJADA);
    });

    it('rejeita transição fora da sequência (CRIADA → AGENDADA)', () => {
      const ordem = novaOrdem();
      expect(() => ordem.transicionarPara(StatusOrdemVenda.AGENDADA, agora)).toThrow(
        TransicaoInvalidaError,
      );
      expect(ordem.status).toBe(StatusOrdemVenda.CRIADA);
    });

    it('rejeita AGENDADA sem agendamento confirmado', () => {
      const ordem = ordemPlanejada();
      expect(() => ordem.transicionarPara(StatusOrdemVenda.AGENDADA, agora)).toThrow(
        AgendamentoNaoConfirmadoError,
      );
    });

    it('permite AGENDADA com agendamento confirmado e segue até ENTREGUE', () => {
      const ordem = ordemAgendada();
      expect(ordem.status).toBe(StatusOrdemVenda.AGENDADA);

      ordem.transicionarPara(StatusOrdemVenda.EM_TRANSPORTE, agora);
      ordem.transicionarPara(StatusOrdemVenda.ENTREGUE, agora);
      expect(ordem.status).toBe(StatusOrdemVenda.ENTREGUE);
    });

    it('rejeita transição a partir de ENTREGUE (estado terminal)', () => {
      const ordem = ordemAgendada();
      ordem.transicionarPara(StatusOrdemVenda.EM_TRANSPORTE, agora);
      ordem.transicionarPara(StatusOrdemVenda.ENTREGUE, agora);

      expect(() => ordem.transicionarPara(StatusOrdemVenda.EM_TRANSPORTE, agora)).toThrow(
        TransicaoInvalidaError,
      );
    });
  });

  describe('agendamento', () => {
    it('define agendamento (não confirmado) quando PLANEJADA', () => {
      const ordem = ordemPlanejada();
      ordem.definirAgendamento({ dataEntrega, janelaInicio: '08:00', janelaFim: '12:00' }, agora);

      expect(ordem.agendamento).toMatchObject({ confirmado: false, janelaInicio: '08:00' });
    });

    it('rejeita definir agendamento quando CRIADA', () => {
      const ordem = novaOrdem();
      expect(() =>
        ordem.definirAgendamento({ dataEntrega, janelaInicio: '08:00', janelaFim: '12:00' }, agora),
      ).toThrow(OperacaoInvalidaParaStatusError);
    });

    it('rejeita definir agendamento quando EM_TRANSPORTE (após o início do transporte)', () => {
      const ordem = ordemAgendada();
      ordem.transicionarPara(StatusOrdemVenda.EM_TRANSPORTE, agora);
      expect(() =>
        ordem.definirAgendamento({ dataEntrega, janelaInicio: '08:00', janelaFim: '12:00' }, agora),
      ).toThrow(OperacaoInvalidaParaStatusError);
    });

    it('rejeita janela com formato inválido', () => {
      const ordem = ordemPlanejada();
      expect(() =>
        ordem.definirAgendamento({ dataEntrega, janelaInicio: '8h', janelaFim: '12:00' }, agora),
      ).toThrow(AgendamentoInvalidoError);
    });

    it('rejeita janela com início >= fim', () => {
      const ordem = ordemPlanejada();
      expect(() =>
        ordem.definirAgendamento({ dataEntrega, janelaInicio: '12:00', janelaFim: '08:00' }, agora),
      ).toThrow(AgendamentoInvalidoError);
    });

    it('confirma o agendamento', () => {
      const ordem = ordemPlanejada();
      ordem.definirAgendamento({ dataEntrega, janelaInicio: '08:00', janelaFim: '12:00' }, agora);
      ordem.confirmarAgendamento(agora);

      expect(ordem.agendamento?.confirmado).toBe(true);
    });

    it('rejeita confirmar sem agendamento', () => {
      const ordem = ordemPlanejada();
      expect(() => ordem.confirmarAgendamento(agora)).toThrow(AgendamentoInexistenteError);
    });

    it('reagenda e volta para não confirmado', () => {
      const ordem = ordemAgendada();
      ordem.reagendar({ dataEntrega, janelaInicio: '13:00', janelaFim: '17:00' }, agora);

      expect(ordem.agendamento).toMatchObject({ janelaInicio: '13:00', confirmado: false });
    });

    it('rejeita reagendar sem agendamento', () => {
      const ordem = ordemPlanejada();
      expect(() =>
        ordem.reagendar({ dataEntrega, janelaInicio: '13:00', janelaFim: '17:00' }, agora),
      ).toThrow(AgendamentoInexistenteError);
    });

    it('rejeita reagendar com janela inválida', () => {
      const ordem = ordemAgendada();
      expect(() =>
        ordem.reagendar({ dataEntrega, janelaInicio: '17:00', janelaFim: '13:00' }, agora),
      ).toThrow(AgendamentoInvalidoError);
    });
  });

  describe('alterarTransporte', () => {
    it('altera o transporte quando CRIADA', () => {
      const ordem = novaOrdem();
      ordem.alterarTransporte('t2', agora);
      expect(ordem.tipoTransporteId).toBe('t2');
    });

    it('rejeita alterar transporte quando AGENDADA', () => {
      const ordem = ordemAgendada();
      expect(() => ordem.alterarTransporte('t2', agora)).toThrow(OperacaoInvalidaParaStatusError);
    });
  });

  describe('restaurar', () => {
    it('reconstrói com agendamento', () => {
      const ordem = OrdemDeVenda.restaurar({
        id: 'ov1',
        clienteId: 'c1',
        tipoTransporteId: 't1',
        status: StatusOrdemVenda.AGENDADA,
        itens: [{ itemId: 'i1', quantidade: 1 }],
        agendamento: { dataEntrega, janelaInicio: '08:00', janelaFim: '12:00', confirmado: true },
        criadoEm: agora,
        atualizadoEm: agora,
      });

      expect(ordem.agendamento?.confirmado).toBe(true);
      expect(ordem.status).toBe(StatusOrdemVenda.AGENDADA);
    });

    it('reconstrói sem agendamento', () => {
      const ordem = OrdemDeVenda.restaurar({
        id: 'ov1',
        clienteId: 'c1',
        tipoTransporteId: 't1',
        status: StatusOrdemVenda.CRIADA,
        itens: [{ itemId: 'i1', quantidade: 1 }],
        agendamento: null,
        criadoEm: agora,
        atualizadoEm: agora,
      });

      expect(ordem.agendamento).toBeNull();
    });
  });
});
