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
];
const itens = [
  { id: 'i1', sku: 'SKU-1', descricao: 'Celulose', unidade: 'KG', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z' },
];

describe('Fluxo principal (API mockada)', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: {
        accessToken: 'tok-123',
        refreshToken: 'ref-123',
        usuario: { id: 'u1', email: 'operador@ovgs.dev', nome: 'Operador OVGS', papel: 'OPERADOR' },
      },
    }).as('login');
    cy.intercept('POST', '**/api/v1/auth/logout', { statusCode: 204 }).as('logout');
    cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: clientes }).as('clientes');
    cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: tipos }).as('tipos');
    cy.intercept('GET', '**/api/v1/itens', { statusCode: 200, body: itens }).as('itens');
  });

  it('faz login, lista e cria uma OV e navega', () => {
    let ordens: unknown[] = [];
    cy.intercept('GET', '**/api/v1/ordens-venda*', (req) => req.reply({ statusCode: 200, body: ordens })).as('ordens');
    cy.intercept('POST', '**/api/v1/ordens-venda', (req) => {
      const nova = {
        id: 'ov-criada',
        clienteId: req.body.clienteId,
        tipoTransporteId: req.body.tipoTransporteId,
        status: 'CRIADA',
        itens: req.body.itens,
        agendamento: null,
        criadoEm: '2026-02-02T10:00:00.000Z',
        atualizadoEm: '2026-02-02T10:00:00.000Z',
      };
      ordens = [nova];
      req.reply({ statusCode: 201, body: nova });
    }).as('criar');

    // --- Login ---
    cy.visit('/login');
    cy.contains('OVGS');
    cy.get('#email').type('operador@ovgs.dev');
    cy.get('#senha').type('operador123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');

    // --- Redireciona para /ordens (lista vazia) ---
    cy.location('pathname').should('eq', '/ordens');
    cy.contains('Nenhuma ordem de venda cadastrada.');

    // --- Cria OV ---
    cy.get('[data-testid="nova-ov"]').click();
    cy.get('#clienteId').select('ACME Ltda');
    cy.get('#tipoTransporteId').select('Rodoviário (ROD)');
    cy.get('#item-0').select('SKU-1 — Celulose');
    cy.get('#qtd-0').clear().type('3');
    cy.get('[data-testid="submit-ov"]').click();
    cy.wait('@criar');

    // --- Lista agora tem 1 OV ---
    cy.get('[data-testid="ov-row"]').should('have.length', 1);
    cy.contains('[data-testid="ov-row"]', 'ACME Ltda');

    // --- Navega para monitoramento ---
    cy.contains('nav a', 'Monitoramento').click();
    cy.location('pathname').should('eq', '/monitoramento');
    cy.contains('Monitoramento Operacional');
    cy.get('[data-testid="monitor-row"]').should('have.length', 1);
  });

  it('logout limpa sessão e volta ao login', () => {
    cy.intercept('GET', '**/api/v1/ordens-venda*', { statusCode: 200, body: [] }).as('ordens');
    cy.visit('/login');
    cy.get('#email').type('operador@ovgs.dev');
    cy.get('#senha').type('operador123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
    cy.location('pathname').should('eq', '/ordens');

    cy.contains('button', 'Sair').click();
    cy.location('pathname').should('eq', '/login');
  });

  it('rota protegida redireciona para login quando não autenticado', () => {
    cy.visit('/ordens');
    cy.location('pathname').should('eq', '/login');
  });
});
