import { ItensPage } from '../../src/features/itens/pages/ItensPage';
import { TiposTransportePage } from '../../src/features/tipos-transporte/pages/TiposTransportePage';
import { mountWithProviders } from '../support/mountWithProviders';

describe('TiposTransportePage', () => {
  it('lista e cria um tipo de transporte', () => {
    cy.intercept('GET', '**/api/v1/tipos-transporte', {
      statusCode: 200,
      body: [{ id: 't1', nome: 'Rodoviário', codigo: 'ROD', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' }],
    }).as('tipos');
    cy.intercept('POST', '**/api/v1/tipos-transporte', {
      statusCode: 201,
      body: { id: 't2', nome: 'Aéreo', codigo: 'AER', ativo: true, criadoEm: '2026-01-02T00:00:00.000Z', atualizadoEm: '2026-01-02T00:00:00.000Z' },
    }).as('criar');

    mountWithProviders(<TiposTransportePage />, ['/tipos-transporte'], 'OPERADOR');
    cy.wait('@tipos');
    cy.get('[data-testid="tipo-row"]').should('have.length', 1);

    cy.contains('button', 'Novo tipo').click();
    cy.get('#nome').type('Aéreo');
    cy.get('#codigo').type('AER');
    cy.contains('button', 'Criar').click();
    cy.wait('@criar').its('request.body').should('deep.eq', { nome: 'Aéreo', codigo: 'AER' });
  });

  it('valida campos obrigatórios', () => {
    cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: [] }).as('tipos');
    mountWithProviders(<TiposTransportePage />, ['/tipos-transporte'], 'OPERADOR');
    cy.wait('@tipos');
    cy.contains('button', 'Novo tipo').click();
    cy.contains('button', 'Criar').click();
    cy.contains('.error', 'Informe o nome');
    cy.contains('.error', 'Informe o código');
  });
});

describe('ItensPage', () => {
  it('lista e cria um item', () => {
    cy.intercept('GET', '**/api/v1/itens', {
      statusCode: 200,
      body: [{ id: 'i1', sku: 'SKU-1', descricao: 'Celulose', unidade: 'KG', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z' }],
    }).as('itens');
    cy.intercept('POST', '**/api/v1/itens', {
      statusCode: 201,
      body: { id: 'i2', sku: 'SKU-2', descricao: 'Papel', unidade: 'CX', ativo: true, criadoEm: '2026-01-02T00:00:00.000Z' },
    }).as('criar');

    mountWithProviders(<ItensPage />, ['/itens'], 'OPERADOR');
    cy.wait('@itens');
    cy.get('[data-testid="item-row"]').should('have.length', 1);

    cy.contains('button', 'Novo item').click();
    cy.get('#sku').type('SKU-2');
    cy.get('#descricao').type('Papel');
    cy.get('#unidade').type('CX');
    cy.contains('button', 'Criar').click();
    cy.wait('@criar').its('request.body').should('deep.eq', { sku: 'SKU-2', descricao: 'Papel', unidade: 'CX' });
  });
});
