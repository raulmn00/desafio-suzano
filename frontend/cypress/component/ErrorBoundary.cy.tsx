import * as Sentry from '@sentry/react';
import { ErroFatal } from '../../src/components/ErroFatal';

function Bomba(): null {
  throw new Error('boom de runtime');
}

describe('ErrorBoundary (Sentry) + fallback ErroFatal', () => {
  it('mostra o fallback quando um filho lança erro em vez de quebrar a árvore', () => {
    // o erro é esperado (capturado pela boundary) — não falhar o teste por causa dele
    cy.on('uncaught:exception', () => false);

    cy.mount(
      <Sentry.ErrorBoundary fallback={<ErroFatal />}>
        <Bomba />
      </Sentry.ErrorBoundary>,
    );

    cy.contains('Algo deu errado').should('be.visible');
    cy.contains('button', 'Recarregar').should('be.visible');
  });
});
