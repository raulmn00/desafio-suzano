import { OrdensPage } from '../../src/features/ordens-venda/pages/OrdensPage';
import { mountWithProviders } from '../support/mountWithProviders';
import { pagina } from '../support/pagina';

const clientes = [
  {
    id: 'c1',
    nome: 'ACME Ltda',
    documento: '12345678000199',
    tipoDocumento: 'CNPJ',
    ativo: true,
    transportesAutorizados: ['t1'],
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

function stubBase() {
  cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: clientes }).as('clientes');
  cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: tipos }).as('tipos');
  cy.intercept('GET', '**/api/v1/itens', { statusCode: 200, body: itens }).as('itens');
}

describe('OrdensPage', () => {
  it('lista ordens existentes', () => {
    stubBase();
    cy.intercept('GET', '**/api/v1/ordens-venda*', {
      statusCode: 200,
      body: pagina([
        {
          id: 'ov-12345678-abcd',
          clienteId: 'c1',
          tipoTransporteId: 't1',
          status: 'CRIADA',
          itens: [{ itemId: 'i1', quantidade: 2 }],
          agendamento: null,
          criadoEm: '2026-02-01T10:00:00.000Z',
          atualizadoEm: '2026-02-01T10:00:00.000Z',
        },
      ]),
    }).as('ordens');

    mountWithProviders(<OrdensPage />, ['/ordens'], 'OPERADOR');
    cy.wait('@ordens');
    cy.get('[data-testid="ov-row"]').should('have.length', 1);
    cy.contains('[data-testid="ov-row"]', 'ACME Ltda');
    cy.contains('.badge', 'Criada');
  });

  it('paginação: "Próxima" busca a página 2 e atualiza o indicador', () => {
    stubBase();
    cy.intercept('GET', '**/api/v1/ordens-venda*', (req) => {
      const page = Number(new URL(req.url).searchParams.get('page') ?? '1');
      req.reply({
        statusCode: 200,
        body: {
          data: [
            {
              id: `ov-pagina-${page}`,
              clienteId: 'c1',
              tipoTransporteId: 't1',
              status: 'CRIADA',
              itens: [{ itemId: 'i1', quantidade: 1 }],
              agendamento: null,
              criadoEm: '2026-02-01T10:00:00.000Z',
              atualizadoEm: '2026-02-01T10:00:00.000Z',
            },
          ],
          page,
          limit: 20,
          total: 25,
          totalPages: 2,
        },
      });
    }).as('ordens');

    mountWithProviders(<OrdensPage />, ['/ordens'], 'OPERADOR');
    cy.wait('@ordens');
    cy.contains('[data-testid="pag-info"]', 'Página 1 de 2');
    cy.get('[data-testid="pag-anterior"]').should('be.disabled');

    cy.get('[data-testid="pag-proxima"]').click();
    cy.wait('@ordens').its('request.url').should('include', 'page=2');
    cy.contains('[data-testid="pag-info"]', 'Página 2 de 2');
    cy.get('[data-testid="pag-proxima"]').should('be.disabled');
  });

  it('só lista transportes autorizados do cliente no formulário de criação', () => {
    stubBase();
    cy.intercept('GET', '**/api/v1/ordens-venda*', { statusCode: 200, body: pagina([]) }).as('ordens');
    mountWithProviders(<OrdensPage />, ['/ordens'], 'OPERADOR');
    cy.wait(['@ordens', '@clientes']);

    // tipos e itens só são buscados quando o modal de criação abre
    cy.get('[data-testid="nova-ov"]').click();
    cy.wait(['@tipos', '@itens']);
    cy.get('#tipoTransporteId').should('be.disabled');

    cy.get('#clienteId').select('ACME Ltda');
    // Apenas t1 (Rodoviário) é autorizado; t2 (Aéreo) não deve aparecer.
    cy.get('#tipoTransporteId option').should('contain.text', 'Rodoviário');
    cy.get('#tipoTransporteId').should('not.contain.text', 'Aéreo');
  });

  it('cria uma ordem com item e quantidade', () => {
    stubBase();
    cy.intercept('GET', '**/api/v1/ordens-venda*', { statusCode: 200, body: pagina([]) }).as('ordens');
    cy.intercept('POST', '**/api/v1/ordens-venda', {
      statusCode: 201,
      body: {
        id: 'ov-new',
        clienteId: 'c1',
        tipoTransporteId: 't1',
        status: 'CRIADA',
        itens: [{ itemId: 'i1', quantidade: 5 }],
        agendamento: null,
        criadoEm: '2026-02-02T10:00:00.000Z',
        atualizadoEm: '2026-02-02T10:00:00.000Z',
      },
    }).as('criar');

    mountWithProviders(<OrdensPage />, ['/ordens'], 'OPERADOR');
    cy.wait('@ordens');
    cy.get('[data-testid="nova-ov"]').click();

    cy.get('#clienteId').select('ACME Ltda');
    cy.get('#tipoTransporteId').select('Rodoviário (ROD)');
    cy.get('#item-0').select('SKU-1 — Celulose');
    cy.get('#qtd-0').clear().type('5');
    cy.get('[data-testid="submit-ov"]').click();

    cy.wait('@criar').its('request.body').should('deep.include', {
      clienteId: 'c1',
      tipoTransporteId: 't1',
    });
  });

  it('valida quantidade mínima ≥ 1', () => {
    stubBase();
    cy.intercept('GET', '**/api/v1/ordens-venda*', { statusCode: 200, body: pagina([]) }).as('ordens');
    mountWithProviders(<OrdensPage />, ['/ordens'], 'OPERADOR');
    cy.wait('@ordens');
    cy.get('[data-testid="nova-ov"]').click();

    cy.get('#clienteId').select('ACME Ltda');
    cy.get('#tipoTransporteId').select('Rodoviário (ROD)');
    cy.get('#item-0').select('SKU-1 — Celulose');
    cy.get('#qtd-0').clear().type('0');
    cy.get('[data-testid="submit-ov"]').click();
    cy.contains('.error', 'Quantidade deve ser ≥ 1');
  });
});
