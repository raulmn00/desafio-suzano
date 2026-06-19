import { DomainValidationError } from '../../../shared/domain/domain-error';
import { Cliente } from './cliente.entity';

describe('Cliente (domínio)', () => {
  const agora = new Date('2026-06-19T10:00:00.000Z');
  const depois = new Date('2026-06-20T10:00:00.000Z');
  const criar = (): Cliente =>
    Cliente.criar({ id: 'c1', nome: '  Acme  ', documento: '529.982.247-25', agora });

  describe('criar', () => {
    it('cria cliente ativo, sem transportes e com nome/documento normalizados', () => {
      const cliente = criar();

      expect(cliente.id).toBe('c1');
      expect(cliente.nome).toBe('Acme');
      expect(cliente.documento.valor).toBe('52998224725');
      expect(cliente.ativo).toBe(true);
      expect(cliente.transportesAutorizados).toEqual([]);
    });

    it('rejeita nome vazio', () => {
      expect(() => Cliente.criar({ id: 'c1', nome: ' ', documento: '52998224725', agora })).toThrow(
        DomainValidationError,
      );
    });

    it('rejeita documento inválido', () => {
      expect(() => Cliente.criar({ id: 'c1', nome: 'Acme', documento: '123', agora })).toThrow(
        DomainValidationError,
      );
    });
  });

  describe('restaurar', () => {
    it('reconstrói deduplicando transportes autorizados', () => {
      const cliente = Cliente.restaurar({
        id: 'c1',
        nome: 'Acme',
        documento: '52998224725',
        ativo: true,
        transportesAutorizados: ['t1', 't1', 't2'],
        criadoEm: agora,
        atualizadoEm: agora,
      });

      expect(cliente.transportesAutorizados).toEqual(['t1', 't2']);
    });
  });

  describe('editar', () => {
    it('edita nome e documento', () => {
      const cliente = criar();
      cliente.editar({ nome: 'Acme S.A.', documento: '11.222.333/0001-81' }, depois);

      expect(cliente.nome).toBe('Acme S.A.');
      expect(cliente.documento.tipo).toBe('CNPJ');
      expect(cliente.atualizadoEm).toBe(depois);
    });

    it('rejeita nome inválido na edição', () => {
      const cliente = criar();
      expect(() => cliente.editar({ nome: '  ' }, depois)).toThrow(DomainValidationError);
    });

    it('rejeita documento inválido na edição', () => {
      const cliente = criar();
      expect(() => cliente.editar({ documento: '999' }, depois)).toThrow(DomainValidationError);
    });
  });

  describe('autorização de transporte', () => {
    it('autoriza um transporte e marca como autorizado', () => {
      const cliente = criar();
      cliente.autorizarTransporte('t1', depois);

      expect(cliente.transporteEstaAutorizado('t1')).toBe(true);
      expect(cliente.transportesAutorizados).toEqual(['t1']);
      expect(cliente.atualizadoEm).toBe(depois);
    });

    it('autorizar é idempotente (não duplica)', () => {
      const cliente = criar();
      cliente.autorizarTransporte('t1', depois);
      cliente.autorizarTransporte('t1', new Date('2026-07-01'));

      expect(cliente.transportesAutorizados).toEqual(['t1']);
      // atualizadoEm não muda na repetição
      expect(cliente.atualizadoEm).toBe(depois);
    });

    it('desautoriza um transporte existente', () => {
      const cliente = criar();
      cliente.autorizarTransporte('t1', agora);
      cliente.desautorizarTransporte('t1', depois);

      expect(cliente.transporteEstaAutorizado('t1')).toBe(false);
      expect(cliente.atualizadoEm).toBe(depois);
    });

    it('desautorizar transporte inexistente é no-op (não muda atualizadoEm)', () => {
      const cliente = criar();
      cliente.desautorizarTransporte('inexistente', depois);

      expect(cliente.atualizadoEm).toBe(agora);
    });
  });

  describe('inativar / ativar', () => {
    it('inativa e reativa', () => {
      const cliente = criar();
      cliente.inativar(depois);
      expect(cliente.ativo).toBe(false);

      cliente.ativar(new Date('2026-07-01'));
      expect(cliente.ativo).toBe(true);
    });
  });
});
