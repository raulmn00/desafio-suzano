import { AuditoriaPage } from '../../src/features/auditoria/pages/AuditoriaPage';
import { MonitoramentoPage } from '../../src/features/ordens-venda/pages/MonitoramentoPage';
import { mountWithProviders } from '../support/mountWithProviders';

const clientes = [
  { id: 'c1', nome: 'ACME Ltda', documento: '12345678000199', tipoDocumento: 'CNPJ', ativo: true, transportesAutorizados: ['t1'], criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
];
const tipos = [
  { id: 't1', nome: 'Rodoviário', codigo: 'ROD', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
];

describe('MonitoramentoPage', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: clientes }).as('clientes');
    cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: tipos }).as('tipos');
  });

  it('lista ordens e aplica filtro por status na query', () => {
    cy.intercept('GET', '**/api/v1/ordens-venda*', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 'ov-1',
            clienteId: 'c1',
            tipoTransporteId: 't1',
            status: 'CRIADA',
            itens: [],
            agendamento: null,
            criadoEm: '2026-02-01T10:00:00.000Z',
            atualizadoEm: '2026-02-01T10:00:00.000Z',
          },
        ],
      });
    }).as('ordens');

    mountWithProviders(<MonitoramentoPage />, ['/monitoramento']);
    cy.wait('@ordens');
    cy.get('[data-testid="monitor-row"]').should('have.length', 1);

    // Aplica filtro de status -> dispara nova request com query param
    cy.get('select').first().select('Entregue');
    cy.wait('@ordens').its('request.url').should('include', 'status=ENTREGUE');
  });
});

describe('AuditoriaPage', () => {
  it('lista eventos de auditoria com ator, ação e estados', () => {
    cy.intercept('GET', '**/api/v1/auditoria*', {
      statusCode: 200,
      body: [
        {
          id: 'a1',
          ocorridoEm: '2026-02-01T10:00:00.000Z',
          ator: 'operador@ovgs.dev',
          acao: 'CRIAR_ORDEM',
          entidadeTipo: 'OrdemVenda',
          entidadeId: 'ov-12345678',
          estadoAnterior: null,
          estadoPosterior: { status: 'CRIADA' },
          correlationId: 'corr-1',
        },
      ],
    }).as('auditoria');

    mountWithProviders(<AuditoriaPage />, ['/auditoria']);
    cy.wait('@auditoria');
    cy.get('[data-testid="audit-row"]').should('have.length', 1);
    cy.contains('[data-testid="audit-row"]', 'operador@ovgs.dev');
    cy.contains('[data-testid="audit-row"]', 'CRIAR_ORDEM');
    cy.contains('[data-testid="audit-row"]', '"status":"CRIADA"');
  });

  it('filtra por id de entidade na query', () => {
    cy.intercept('GET', '**/api/v1/auditoria*', { statusCode: 200, body: [] }).as('auditoria');
    cy.intercept('GET', '**/api/v1/auditoria?*entidadeId=ov-1*', { statusCode: 200, body: [] }).as('auditoriaFiltrada');
    mountWithProviders(<AuditoriaPage />, ['/auditoria']);
    cy.wait('@auditoria');
    cy.get('input').first().type('ov-1');
    // Cada tecla refaz a query; a última deve conter o valor completo.
    cy.wait('@auditoriaFiltrada').its('request.url').should('include', 'entidadeId=ov-1');
  });
});
