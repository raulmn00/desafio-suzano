import { DomainValidationError } from '../../../shared/domain/domain-error';
import { Item } from './item.entity';

describe('Item (domínio)', () => {
  const agora = new Date('2026-06-19T10:00:00.000Z');

  describe('criar', () => {
    it('cria um item ativo com sku normalizado em maiúsculas e campos saneados', () => {
      const item = Item.criar({
        id: 'i1',
        sku: ' sku-001 ',
        descricao: '  Papel A4 75g  ',
        unidade: '  CX  ',
        agora,
      });

      expect(item.id).toBe('i1');
      expect(item.sku).toBe('SKU-001');
      expect(item.descricao).toBe('Papel A4 75g');
      expect(item.unidade).toBe('CX');
      expect(item.ativo).toBe(true);
      expect(item.criadoEm).toBe(agora);
    });

    it('rejeita descrição vazia', () => {
      expect(() =>
        Item.criar({ id: 'i1', sku: 'SKU-001', descricao: '   ', unidade: 'CX', agora }),
      ).toThrow(DomainValidationError);
    });

    it('rejeita unidade vazia', () => {
      expect(() =>
        Item.criar({ id: 'i1', sku: 'SKU-001', descricao: 'Papel A4', unidade: '  ', agora }),
      ).toThrow(DomainValidationError);
    });

    it('rejeita sku vazio', () => {
      expect(() =>
        Item.criar({ id: 'i1', sku: '   ', descricao: 'Papel A4', unidade: 'CX', agora }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('restaurar', () => {
    it('reconstrói a entidade a partir da persistência sem revalidar', () => {
      const item = Item.restaurar({
        id: 'i1',
        sku: 'SKU-002',
        descricao: 'Caixa de papelão',
        unidade: 'UN',
        ativo: false,
        criadoEm: agora,
      });

      expect(item.id).toBe('i1');
      expect(item.sku).toBe('SKU-002');
      expect(item.descricao).toBe('Caixa de papelão');
      expect(item.unidade).toBe('UN');
      expect(item.ativo).toBe(false);
      expect(item.criadoEm).toBe(agora);
    });
  });

  describe('normalizarSku', () => {
    it('faz trim e uppercase', () => {
      expect(Item.normalizarSku('  abc-9 ')).toBe('ABC-9');
    });

    it('rejeita sku vazio', () => {
      expect(() => Item.normalizarSku('   ')).toThrow(DomainValidationError);
    });
  });
});
