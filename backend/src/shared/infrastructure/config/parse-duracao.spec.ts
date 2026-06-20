import { parseDuracaoMs } from './parse-duracao';

describe('parseDuracaoMs', () => {
  it('converte segundos, minutos, horas e dias', () => {
    expect(parseDuracaoMs('30s')).toBe(30_000);
    expect(parseDuracaoMs('15m')).toBe(15 * 60_000);
    expect(parseDuracaoMs('2h')).toBe(2 * 3_600_000);
    expect(parseDuracaoMs('7d')).toBe(7 * 86_400_000);
  });

  it('aceita número puro como segundos', () => {
    expect(parseDuracaoMs('45')).toBe(45_000);
  });

  it('lança em formato inválido', () => {
    expect(() => parseDuracaoMs('abc')).toThrow();
    expect(() => parseDuracaoMs('10x')).toThrow();
    expect(() => parseDuracaoMs('')).toThrow();
  });
});
