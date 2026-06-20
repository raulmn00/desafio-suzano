import { Route, Routes } from 'react-router-dom';
import { OrdemDetailPage } from '../../src/features/ordens-venda/pages/OrdemDetailPage';
import { mountWithProviders } from '../support/mountWithProviders';

const clientes = [
  {
    id: 'c1',
    nome: 'ACME Ltda',
    documento: '12345678000199',
    tipoDocumento: 'CNPJ',
    ativo: true,
    transportesAutorizados: ['t1', 't2'],
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
];
const tipos = [
  { id: 't1', nome: 'Rodoviário', codigo: 'ROD', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 't2', nome: 'Aéreo', codigo: 'AER', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
];
const itens = [
  { id: 'i1', sku: 'SKU-1', descricao: 'Celulose', unidade: 'KG', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z' },
];

function ordem(over: Record<string, unknown> = {}) {
  return {
    id: 'ov-1',
    clienteId: 'c1',
    tipoTransporteId: 't1',
    status: 'CRIADA',
    itens: [{ itemId: 'i1', quantidade: 2 }],
    agendamento: null,
    criadoEm: '2026-02-01T10:00:00.000Z',
    atualizadoEm: '2026-02-01T10:00:00.000Z',
    ...over,
  };
}

function stubLookups() {
  cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: clientes }).as('clientes');
  cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: tipos }).as('tipos');
  cy.intercept('GET', '**/api/v1/itens', { statusCode: 200, body: itens }).as('itens');
}

function mountDetail() {
  mountWithProviders(
    <Routes>
      <Route path="/ordens/:id" element={<OrdemDetailPage />} />
    </Routes>,
    ['/ordens/ov-1'],
  );
}

describe('OrdemDetailPage', () => {
  it('mostra dados, itens e botão de avançar status', () => {
    stubLookups();
    cy.intercept('GET', '**/api/v1/ordens-venda/ov-1', { statusCode: 200, body: ordem() }).as('ordem');
    mountDetail();
    cy.wait('@ordem');

    cy.contains('Cliente:').parent().should('contain.text', 'ACME Ltda');
    cy.contains('.badge', 'Criada');
    cy.contains('td', 'SKU-1 — Celulose');
    cy.get('[data-testid="avancar-status"]').should('contain.text', 'Avançar para Planejada');
  });

  it('bloqueia avanço para AGENDADA sem agendamento confirmado', () => {
    stubLookups();
    cy.intercept('GET', '**/api/v1/ordens-venda/ov-1', { statusCode: 200, body: ordem({ status: 'PLANEJADA' }) }).as('ordem');
    mountDetail();
    cy.wait('@ordem');
    cy.get('[data-testid="avancar-status"]').should('be.disabled');
    cy.contains('agendamento confirmado');
  });

  it('avança o status com agendamento confirmado', () => {
    stubLookups();
    const ag = { dataEntrega: '2026-03-01T00:00:00.000Z', janelaInicio: '08:00', janelaFim: '12:00', confirmado: true };
    cy.intercept('GET', '**/api/v1/ordens-venda/ov-1', { statusCode: 200, body: ordem({ status: 'PLANEJADA', agendamento: ag }) }).as('ordem');
    cy.intercept('PATCH', '**/api/v1/ordens-venda/ov-1/status', { statusCode: 200, body: ordem({ status: 'AGENDADA', agendamento: ag }) }).as('status');
    mountDetail();
    cy.wait('@ordem');
    cy.get('[data-testid="avancar-status"]').should('not.be.disabled').click();
    cy.wait('@status').its('request.body').should('deep.eq', { status: 'AGENDADA' });
  });

  it('altera o transporte por um autorizado do cliente', () => {
    stubLookups();
    cy.intercept('GET', '**/api/v1/ordens-venda/ov-1', { statusCode: 200, body: ordem() }).as('ordem');
    cy.intercept('PATCH', '**/api/v1/ordens-venda/ov-1/transporte', { statusCode: 200, body: ordem({ tipoTransporteId: 't2' }) }).as('transporte');
    mountDetail();
    cy.wait(['@ordem', '@tipos']);
    cy.get('select[aria-label="Novo transporte"]').select('Aéreo (AER)');
    cy.contains('button', 'Alterar').click();
    cy.wait('@transporte').its('request.body').should('deep.eq', { tipoTransporteId: 't2' });
  });
});
