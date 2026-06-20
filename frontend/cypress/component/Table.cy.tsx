import { Table } from '../../src/components/ui/Table';

describe('Table', () => {
  it('renderiza cabeçalhos e linhas', () => {
    cy.mount(
      <Table columns={['Nome', 'Código']} isEmpty={false}>
        <tr>
          <td>Rodoviário</td>
          <td>ROD</td>
        </tr>
      </Table>,
    );
    cy.get('thead th').should('have.length', 2);
    cy.get('thead th').first().should('have.text', 'Nome');
    cy.get('tbody tr').should('have.length', 1);
    cy.contains('td', 'Rodoviário');
  });

  it('mostra a mensagem de vazio com colspan correto', () => {
    cy.mount(<Table columns={['A', 'B', 'C']} isEmpty empty="Nada aqui" />);
    cy.get('.table-empty').should('have.text', 'Nada aqui');
    cy.get('.table-empty').should('have.attr', 'colspan', '3');
  });
});
