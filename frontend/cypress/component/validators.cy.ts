import { isValidDocumento, isValidHorario, onlyDigits } from '../../src/lib/validators';
import { formatDate, formatDateTime, toDateInput } from '../../src/lib/format';

describe('validators', () => {
  it('onlyDigits remove máscara', () => {
    expect(onlyDigits('123.456.789-09')).to.eq('12345678909');
  });

  it('isValidDocumento aceita CPF (11) e CNPJ (14)', () => {
    expect(isValidDocumento('12345678909')).to.eq(true);
    expect(isValidDocumento('12.345.678/0001-99')).to.eq(true);
    expect(isValidDocumento('123')).to.eq(false);
  });

  it('isValidHorario valida HH:mm', () => {
    expect(isValidHorario('08:00')).to.eq(true);
    expect(isValidHorario('23:59')).to.eq(true);
    expect(isValidHorario('24:00')).to.eq(false);
    expect(isValidHorario('8:0')).to.eq(false);
  });
});

describe('format', () => {
  it('formatDate e formatDateTime tratam nulos', () => {
    expect(formatDate(null)).to.eq('—');
    expect(formatDateTime(undefined)).to.eq('—');
  });

  it('toDateInput extrai yyyy-mm-dd', () => {
    expect(toDateInput('2026-03-01T00:00:00.000Z')).to.eq('2026-03-01');
    expect(toDateInput(null)).to.eq('');
  });

  it('formatDate formata data ISO', () => {
    expect(formatDate('2026-03-01T00:00:00.000Z')).to.eq('01/03/2026');
  });
});
