import { DomainValidationError } from '../../../shared/domain/domain-error';
import { Documento } from './documento.vo';

describe('Documento (value object)', () => {
  it('aceita CPF com 11 dígitos e remove a máscara', () => {
    const doc = Documento.criar('529.982.247-25');

    expect(doc.valor).toBe('52998224725');
    expect(doc.tipo).toBe('CPF');
  });

  it('aceita CNPJ com 14 dígitos', () => {
    const doc = Documento.criar('11.222.333/0001-81');

    expect(doc.valor).toBe('11222333000181');
    expect(doc.tipo).toBe('CNPJ');
  });

  it('rejeita comprimento inválido', () => {
    expect(() => Documento.criar('123')).toThrow(DomainValidationError);
  });

  it('rejeita dígitos todos iguais', () => {
    expect(() => Documento.criar('00000000000')).toThrow(DomainValidationError);
  });

  it('restaura a partir do valor persistido sem revalidar', () => {
    expect(Documento.restaurar('52998224725').valor).toBe('52998224725');
  });

  it('compara igualdade por valor', () => {
    expect(Documento.criar('52998224725').igualA(Documento.restaurar('52998224725'))).toBe(true);
    expect(Documento.criar('52998224725').igualA(Documento.criar('11222333000181'))).toBe(false);
  });
});
