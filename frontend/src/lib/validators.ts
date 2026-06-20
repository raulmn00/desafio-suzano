/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Documento válido = 11 (CPF) ou 14 (CNPJ) dígitos após remover máscara. */
export function isValidDocumento(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 11 || digits.length === 14;
}

/** janela HH:mm (00:00 a 23:59). */
export const HORARIO_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHorario(value: string): boolean {
  return HORARIO_REGEX.test(value);
}
