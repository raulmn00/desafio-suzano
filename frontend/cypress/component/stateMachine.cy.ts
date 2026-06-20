import { bloqueioTransicao, proximoStatus, STATUS_LABEL } from '../../src/features/ordens-venda/stateMachine';

describe('stateMachine', () => {
  it('retorna a próxima transição sequencial', () => {
    expect(proximoStatus('CRIADA')).to.eq('PLANEJADA');
    expect(proximoStatus('PLANEJADA')).to.eq('AGENDADA');
    expect(proximoStatus('AGENDADA')).to.eq('EM_TRANSPORTE');
    expect(proximoStatus('EM_TRANSPORTE')).to.eq('ENTREGUE');
    expect(proximoStatus('ENTREGUE')).to.eq(null);
  });

  it('bloqueia avanço para AGENDADA sem agendamento confirmado', () => {
    expect(bloqueioTransicao('PLANEJADA', false)).to.contain('agendamento confirmado');
    expect(bloqueioTransicao('PLANEJADA', true)).to.eq(null);
  });

  it('libera as demais transições sem restrição de agendamento', () => {
    expect(bloqueioTransicao('CRIADA', false)).to.eq(null);
    expect(bloqueioTransicao('AGENDADA', false)).to.eq(null);
    expect(bloqueioTransicao('EM_TRANSPORTE', false)).to.eq(null);
  });

  it('informa quando já está entregue', () => {
    expect(bloqueioTransicao('ENTREGUE', true)).to.contain('entregue');
  });

  it('expõe rótulos legíveis de todos os status', () => {
    expect(STATUS_LABEL.CRIADA).to.eq('Criada');
    expect(STATUS_LABEL.EM_TRANSPORTE).to.eq('Em transporte');
    expect(STATUS_LABEL.ENTREGUE).to.eq('Entregue');
  });
});
