import { DomainValidationError } from '../../../shared/domain/domain-error';
import { TipoTransporte } from './tipo-transporte.entity';

describe('TipoTransporte (domínio)', () => {
  const agora = new Date('2026-06-19T10:00:00.000Z');

  describe('criar', () => {
    it('cria um tipo de transporte ativo com código normalizado em maiúsculas', () => {
      const tipo = TipoTransporte.criar({ id: 't1', nome: '  Caminhão  ', codigo: ' cam ', agora });

      expect(tipo.id).toBe('t1');
      expect(tipo.nome).toBe('Caminhão');
      expect(tipo.codigo).toBe('CAM');
      expect(tipo.ativo).toBe(true);
      expect(tipo.criadoEm).toBe(agora);
      expect(tipo.atualizadoEm).toBe(agora);
    });

    it('rejeita nome vazio', () => {
      expect(() => TipoTransporte.criar({ id: 't1', nome: '   ', codigo: 'CAM', agora })).toThrow(
        DomainValidationError,
      );
    });

    it('rejeita código vazio', () => {
      expect(() => TipoTransporte.criar({ id: 't1', nome: 'Caminhão', codigo: '  ', agora })).toThrow(
        DomainValidationError,
      );
    });
  });

  describe('restaurar', () => {
    it('reconstrói a entidade a partir da persistência sem revalidar', () => {
      const tipo = TipoTransporte.restaurar({
        id: 't1',
        nome: 'Carreta',
        codigo: 'CAR',
        ativo: false,
        criadoEm: agora,
        atualizadoEm: agora,
      });

      expect(tipo.nome).toBe('Carreta');
      expect(tipo.ativo).toBe(false);
    });
  });

  describe('editar', () => {
    const base = (): TipoTransporte =>
      TipoTransporte.criar({ id: 't1', nome: 'Caminhão', codigo: 'CAM', agora });
    const depois = new Date('2026-06-20T10:00:00.000Z');

    it('edita apenas o nome', () => {
      const tipo = base();
      tipo.editar({ nome: 'Caminhão Truck' }, depois);

      expect(tipo.nome).toBe('Caminhão Truck');
      expect(tipo.codigo).toBe('CAM');
      expect(tipo.atualizadoEm).toBe(depois);
    });

    it('edita apenas o código (normalizado)', () => {
      const tipo = base();
      tipo.editar({ codigo: 'truck' }, depois);

      expect(tipo.codigo).toBe('TRUCK');
      expect(tipo.nome).toBe('Caminhão');
    });

    it('edita nome e código juntos', () => {
      const tipo = base();
      tipo.editar({ nome: 'Bi-truck', codigo: 'bitruck' }, depois);

      expect(tipo.nome).toBe('Bi-truck');
      expect(tipo.codigo).toBe('BITRUCK');
    });

    it('rejeita edição com nome inválido', () => {
      const tipo = base();
      expect(() => tipo.editar({ nome: '  ' }, depois)).toThrow(DomainValidationError);
    });

    it('rejeita edição com código inválido', () => {
      const tipo = base();
      expect(() => tipo.editar({ codigo: '  ' }, depois)).toThrow(DomainValidationError);
    });
  });

  describe('inativar / ativar', () => {
    const depois = new Date('2026-06-21T10:00:00.000Z');

    it('inativa o tipo de transporte', () => {
      const tipo = TipoTransporte.criar({ id: 't1', nome: 'Caminhão', codigo: 'CAM', agora });
      tipo.inativar(depois);

      expect(tipo.ativo).toBe(false);
      expect(tipo.atualizadoEm).toBe(depois);
    });

    it('reativa o tipo de transporte', () => {
      const tipo = TipoTransporte.restaurar({
        id: 't1',
        nome: 'Caminhão',
        codigo: 'CAM',
        ativo: false,
        criadoEm: agora,
        atualizadoEm: agora,
      });
      tipo.ativar(depois);

      expect(tipo.ativo).toBe(true);
      expect(tipo.atualizadoEm).toBe(depois);
    });
  });
});
