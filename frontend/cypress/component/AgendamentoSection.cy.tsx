import { AgendamentoSection } from '../../src/features/ordens-venda/components/AgendamentoSection';
import type { OrdemVenda } from '../../src/features/ordens-venda/schema';
import { mountWithProviders } from '../support/mountWithProviders';

const baseOrdem: OrdemVenda = {
  id: 'ov-1',
  clienteId: 'c1',
  tipoTransporteId: 't1',
  status: 'PLANEJADA',
  itens: [{ itemId: 'i1', quantidade: 1 }],
  agendamento: null,
  criadoEm: '2026-02-01T10:00:00.000Z',
  atualizadoEm: '2026-02-01T10:00:00.000Z',
};

describe('AgendamentoSection', () => {
  it('cria um agendamento novo quando não existe', () => {
    cy.intercept('POST', '**/api/v1/ordens-venda/ov-1/agendamento', {
      statusCode: 201,
      body: { ...baseOrdem, agendamento: { dataEntrega: '2026-03-01T00:00:00.000Z', janelaInicio: '08:00', janelaFim: '12:00', confirmado: false } },
    }).as('criar');

    mountWithProviders(<AgendamentoSection ordem={baseOrdem} />, ['/'], 'OPERADOR');
    cy.contains('Nenhum agendamento definido');
    cy.get('#dataEntrega').type('2026-03-01');
    cy.get('#janelaInicio').type('08:00');
    cy.get('#janelaFim').type('12:00');
    cy.contains('button', 'Definir agendamento').click();
    cy.wait('@criar').its('request.body').should('deep.equal', {
      dataEntrega: '2026-03-01',
      janelaInicio: '08:00',
      janelaFim: '12:00',
    });
  });

  it('mostra botão confirmar quando há agendamento pendente', () => {
    const comAgendamento: OrdemVenda = {
      ...baseOrdem,
      agendamento: { dataEntrega: '2026-03-01T00:00:00.000Z', janelaInicio: '08:00', janelaFim: '12:00', confirmado: false },
    };
    cy.intercept('POST', '**/api/v1/ordens-venda/ov-1/agendamento/confirmar', {
      statusCode: 200,
      body: { ...comAgendamento, agendamento: { ...comAgendamento.agendamento!, confirmado: true } },
    }).as('confirmar');

    mountWithProviders(<AgendamentoSection ordem={comAgendamento} />, ['/'], 'OPERADOR');
    cy.contains('pendente de confirmação');
    cy.get('[data-testid="confirmar-agendamento"]').click();
    cy.wait('@confirmar');
  });

  it('não mostra confirmar quando já confirmado', () => {
    const confirmado: OrdemVenda = {
      ...baseOrdem,
      status: 'AGENDADA',
      agendamento: { dataEntrega: '2026-03-01T00:00:00.000Z', janelaInicio: '08:00', janelaFim: '12:00', confirmado: true },
    };
    mountWithProviders(<AgendamentoSection ordem={confirmado} />, ['/'], 'OPERADOR');
    cy.contains('CONFIRMADO');
    cy.get('[data-testid="confirmar-agendamento"]').should('not.exist');
  });
});
