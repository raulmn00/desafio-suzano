import { Badge } from '../../src/components/ui/Badge';

describe('Badge', () => {
  it('renderiza o rótulo legível e a classe do status conhecido', () => {
    cy.mount(<Badge status="EM_TRANSPORTE" />);
    cy.get('.badge').should('have.text', 'Em transporte');
    cy.get('.badge').should('have.class', 'em_transporte');
    cy.get('.badge').should('have.attr', 'data-status', 'EM_TRANSPORTE');
  });

  it('renderiza cada status do fluxo com sua cor', () => {
    const map: Array<[string, string]> = [
      ['CRIADA', 'Criada'],
      ['PLANEJADA', 'Planejada'],
      ['AGENDADA', 'Agendada'],
      ['ENTREGUE', 'Entregue'],
    ];
    map.forEach(([status, label]) => {
      cy.mount(<Badge status={status} />);
      cy.get('.badge').should('have.text', label).and('have.class', status.toLowerCase());
    });
  });

  it('usa estilo neutro para status desconhecido e mostra o texto cru', () => {
    cy.mount(<Badge status="DESCONHECIDO" />);
    cy.get('.badge').should('have.class', 'neutral').and('have.text', 'DESCONHECIDO');
  });
});
