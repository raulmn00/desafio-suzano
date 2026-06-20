/**
 * E2E de divisão de UI por papel contra a API real. Confirma que o AUDITOR
 * (somente leitura) NÃO vê ações de escrita e que o OPERADOR vê. Cada
 * `cy.screenshot` é evidência de runtime.
 */
const login = (email: string, senha: string) => {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#senha').type(senha);
  cy.get('button[type="submit"]').click();
  cy.location('pathname', { timeout: 10000 }).should('eq', '/ordens');
};

describe('RBAC frontend — AUDITOR é somente leitura', () => {
  beforeEach(() => login('auditor@ovgs.dev', 'auditor123'));

  it('cabeçalho indica papel AUDITOR · somente leitura e Nav permite ler todas as seções', () => {
    cy.contains('.role', 'AUDITOR');
    cy.contains('.role', 'somente leitura');
    ['Ordens de Venda', 'Monitoramento', 'Agendamento', 'Clientes', 'Tipos de Transporte', 'Itens', 'Auditoria'].forEach(
      (l) => cy.contains('nav a', l).should('be.visible'),
    );
  });

  it('NÃO exibe nenhuma ação de escrita', () => {
    cy.get('[data-testid="nova-ov"]').should('not.exist');

    cy.contains('nav a', 'Tipos de Transporte').click();
    cy.get('[data-testid="tipo-row"]').should('have.length.greaterThan', 0); // lê normalmente
    cy.contains('button', 'Novo tipo').should('not.exist');
    cy.contains('button', 'Editar').should('not.exist');
    cy.screenshot('auditor-tipos-somente-leitura', { capture: 'viewport' });

    cy.contains('nav a', 'Clientes').click();
    cy.contains('button', 'Novo cliente').should('not.exist');

    cy.contains('nav a', 'Itens').click();
    cy.contains('button', 'Novo item').should('not.exist');
  });
});

describe('RBAC frontend — OPERADOR vê as ações de escrita', () => {
  beforeEach(() => login('operador@ovgs.dev', 'operador123'));

  it('exibe ações de escrita em ordens e cadastros', () => {
    cy.get('[data-testid="nova-ov"]').should('be.visible');

    cy.contains('nav a', 'Tipos de Transporte').click();
    cy.contains('button', 'Novo tipo').should('be.visible');
    cy.contains('button', 'Editar').should('be.visible');
    cy.screenshot('operador-tipos-com-acoes', { capture: 'viewport' });
  });
});
