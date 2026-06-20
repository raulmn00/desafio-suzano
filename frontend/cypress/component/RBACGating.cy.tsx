import { AgendamentoSection } from '../../src/features/ordens-venda/components/AgendamentoSection';
import { ClientesPage } from '../../src/features/clientes/pages/ClientesPage';
import { ItensPage } from '../../src/features/itens/pages/ItensPage';
import { OrdensPage } from '../../src/features/ordens-venda/pages/OrdensPage';
import { TiposTransportePage } from '../../src/features/tipos-transporte/pages/TiposTransportePage';
import type { OrdemVenda } from '../../src/features/ordens-venda/schema';
import { mountWithProviders } from '../support/mountWithProviders';

const tipos = [
  { id: 't1', nome: 'Rodoviário', codigo: 'ROD', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
];
const itens = [
  { id: 'i1', sku: 'SKU-1', descricao: 'Celulose', unidade: 'KG', ativo: true, criadoEm: '2026-01-01T00:00:00.000Z' },
];
const clientes = [
  { id: 'c1', nome: 'ACME', documento: '12345678000199', tipoDocumento: 'CNPJ', ativo: true, transportesAutorizados: ['t1'], criadoEm: '2026-01-01T00:00:00.000Z', atualizadoEm: '2026-01-01T00:00:00.000Z' },
];

function stubReads() {
  cy.intercept('GET', '**/api/v1/tipos-transporte', { statusCode: 200, body: tipos }).as('tipos');
  cy.intercept('GET', '**/api/v1/itens', { statusCode: 200, body: itens }).as('itens');
  cy.intercept('GET', '**/api/v1/clientes', { statusCode: 200, body: clientes }).as('clientes');
  cy.intercept('GET', '**/api/v1/ordens-venda*', { statusCode: 200, body: [] }).as('ordens');
}

describe('Divisão de UI por papel (RBAC frontend)', () => {
  describe('AUDITOR (somente leitura) NÃO vê ações de escrita', () => {
    it('TiposTransportePage: sem "Novo tipo" nem "Editar"', () => {
      stubReads();
      mountWithProviders(<TiposTransportePage />, ['/tipos-transporte'], 'AUDITOR');
      cy.wait('@tipos');
      cy.get('[data-testid="tipo-row"]').should('have.length', 1); // lê normalmente
      cy.contains('button', 'Novo tipo').should('not.exist');
      cy.contains('button', 'Editar').should('not.exist');
    });

    it('ItensPage: sem "Novo item"', () => {
      stubReads();
      mountWithProviders(<ItensPage />, ['/itens'], 'AUDITOR');
      cy.wait('@itens');
      cy.get('[data-testid="item-row"]').should('have.length', 1);
      cy.contains('button', 'Novo item').should('not.exist');
    });

    it('ClientesPage: sem "Novo cliente", "Editar" nem "Transportes"', () => {
      stubReads();
      mountWithProviders(<ClientesPage />, ['/clientes'], 'AUDITOR');
      cy.wait('@clientes');
      cy.get('[data-testid="cliente-row"]').should('have.length', 1);
      cy.contains('button', 'Novo cliente').should('not.exist');
      cy.contains('button', 'Editar').should('not.exist');
      cy.contains('button', 'Transportes').should('not.exist');
    });

    it('OrdensPage: sem "Nova ordem"', () => {
      stubReads();
      mountWithProviders(<OrdensPage />, ['/ordens'], 'AUDITOR');
      cy.wait('@ordens');
      cy.get('[data-testid="nova-ov"]').should('not.exist');
    });

    it('AgendamentoSection: sem formulário/ações, mas mostra o status (leitura)', () => {
      const ordem = {
        id: 'ov1',
        clienteId: 'c1',
        tipoTransporteId: 't1',
        status: 'AGENDADA',
        itens: [{ itemId: 'i1', quantidade: 1 }],
        agendamento: { dataEntrega: '2026-07-01T00:00:00.000Z', janelaInicio: '08:00', janelaFim: '12:00', confirmado: true },
        criadoEm: '2026-01-01T00:00:00.000Z',
        atualizadoEm: '2026-01-01T00:00:00.000Z',
      } as OrdemVenda;
      mountWithProviders(<AgendamentoSection ordem={ordem} />, ['/'], 'AUDITOR');
      cy.contains('CONFIRMADO'); // status visível (leitura)
      cy.contains('button', 'Definir agendamento').should('not.exist');
      cy.contains('button', 'Reagendar').should('not.exist');
      cy.contains('button', 'Confirmar agendamento').should('not.exist');
    });
  });

  describe('OPERADOR vê as ações de escrita', () => {
    it('TiposTransportePage: "Novo tipo" e "Editar" presentes', () => {
      stubReads();
      mountWithProviders(<TiposTransportePage />, ['/tipos-transporte'], 'OPERADOR');
      cy.wait('@tipos');
      cy.contains('button', 'Novo tipo').should('be.visible');
      cy.contains('button', 'Editar').should('be.visible');
    });

    it('ItensPage: "Novo item" presente', () => {
      stubReads();
      mountWithProviders(<ItensPage />, ['/itens'], 'OPERADOR');
      cy.wait('@itens');
      cy.contains('button', 'Novo item').should('be.visible');
    });

    it('ClientesPage: "Novo cliente" presente', () => {
      stubReads();
      mountWithProviders(<ClientesPage />, ['/clientes'], 'OPERADOR');
      cy.wait('@clientes');
      cy.contains('button', 'Novo cliente').should('be.visible');
      cy.contains('button', 'Editar').should('be.visible');
    });

    it('OrdensPage: "Nova ordem" presente', () => {
      stubReads();
      mountWithProviders(<OrdensPage />, ['/ordens'], 'OPERADOR');
      cy.wait('@ordens');
      cy.get('[data-testid="nova-ov"]').should('be.visible');
    });
  });
});
