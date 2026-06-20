import { ClientesPage } from '../../src/features/clientes/pages/ClientesPage';
import { mountWithProviders } from '../support/mountWithProviders';

const tipos = [
  { id: 't1', nome: 'Rodoviário', codigo: 'ROD', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 't2', nome: 'Aéreo', codigo: 'AER', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
];

function cliente(transportes: string[] = []) {
  return {
    id: 'c1',
    nome: 'ACME Ltda',
    documento: '12345678000199',
    tipoDocumento: 'CNPJ',
    ativo: true,
    transportesAutorizados: transportes,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  };
}

describe('ClientesPage', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: tipos }).as('tipos');
  });

  it('lista clientes', () => {
    cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: [cliente(['t1'])] }).as('clientes');
    mountWithProviders(<ClientesPage />, ['/clientes'], 'OPERADOR');
    cy.wait('@clientes');
    cy.get('[data-testid="cliente-row"]').should('have.length', 1);
    cy.contains('[data-testid="cliente-row"]', 'ACME Ltda');
    cy.contains('[data-testid="cliente-row"]', 'Rodoviário');
  });

  it('valida documento inválido ao criar', () => {
    cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: [] }).as('clientes');
    mountWithProviders(<ClientesPage />, ['/clientes'], 'OPERADOR');
    cy.wait('@clientes');
    cy.contains('button', 'Novo cliente').click();
    cy.get('#nome').type('Fulano');
    cy.get('#documento').type('123');
    cy.contains('button', 'Criar').click();
    cy.contains('.error', 'Documento inválido');
  });

  it('autoriza um transporte para o cliente', () => {
    cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: [cliente([])] }).as('clientes');
    cy.intercept('POST', '**/api/v1/clientes/c1/transportes', {
      statusCode: 201,
      body: cliente(['t1']),
    }).as('autorizar');

    mountWithProviders(<ClientesPage />, ['/clientes'], 'OPERADOR');
    cy.wait('@clientes');
    cy.contains('[data-testid="cliente-row"] button', 'Transportes').click();
    cy.get('select[aria-label="Tipo de transporte"]').select('Rodoviário (ROD)');
    cy.contains('button', 'Autorizar').click();
    cy.wait('@autorizar').its('request.body').should('deep.eq', { tipoTransporteId: 't1' });
  });

  it('desautoriza um transporte existente', () => {
    cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: [cliente(['t1'])] }).as('clientes');
    cy.intercept('DELETE', '**/api/v1/clientes/c1/transportes/t1', { statusCode: 204 }).as('remover');

    mountWithProviders(<ClientesPage />, ['/clientes'], 'OPERADOR');
    cy.wait('@clientes');
    cy.contains('[data-testid="cliente-row"] button', 'Transportes').click();
    cy.get('[data-testid="transporte-tag"]').should('have.length', 1);
    cy.get('[data-testid="transporte-tag"] button').click();
    cy.wait('@remover');
  });
});
