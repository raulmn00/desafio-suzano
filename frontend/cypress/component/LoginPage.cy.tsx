import { LoginPage } from '../../src/auth/LoginPage';
import { mountWithProviders } from '../support/mountWithProviders';

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exibe credenciais de exemplo e o branding', () => {
    mountWithProviders(<LoginPage />, ['/login']);
    cy.contains('.brand', 'OVGS');
    cy.contains('operador@ovgs.dev');
    cy.contains('auditor@ovgs.dev');
  });

  it('valida campos obrigatórios e formato de e-mail', () => {
    mountWithProviders(<LoginPage />, ['/login']);
    cy.get('button[type="submit"]').click();
    cy.contains('.error', 'Informe o e-mail');
    cy.contains('.error', 'Informe a senha');

    cy.get('#email').type('nao-eh-email');
    cy.get('#senha').type('123');
    cy.get('button[type="submit"]').click();
    cy.contains('.error', 'E-mail inválido');
  });

  it('chama a API e persiste a sessão no sucesso', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: {
        accessToken: 'tok-123',
        usuario: { id: 'u1', email: 'operador@ovgs.dev', nome: 'Operador', papel: 'OPERADOR' },
      },
    }).as('login');

    mountWithProviders(<LoginPage />, ['/login']);
    cy.get('#email').type('operador@ovgs.dev');
    cy.get('#senha').type('operador123');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('ovgs.token')).to.eq('tok-123');
    });
  });

  it('mostra a mensagem de erro da API em falha de login', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: { statusCode: 401, code: 'CREDENCIAIS_INVALIDAS', message: 'Credenciais inválidas', timestamp: '' },
    }).as('login');

    mountWithProviders(<LoginPage />, ['/login']);
    cy.get('#email').type('x@y.com');
    cy.get('#senha').type('errada');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');
    cy.contains('.alert.error', 'Credenciais inválidas');
  });
});
