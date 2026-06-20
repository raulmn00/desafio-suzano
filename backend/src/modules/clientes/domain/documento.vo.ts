import { DomainValidationError } from '../../../shared/domain/domain-error';

/**
 * Value Object de documento fiscal (CPF ou CNPJ). Normaliza para apenas dígitos
 * e valida o comprimento (11 = CPF, 14 = CNPJ), rejeitando sequências de dígitos
 * repetidos. A validação garante a invariante já na construção: não existe
 * `Documento` inválido em memória.
 */
export class Documento {
  private constructor(private readonly digitos: string) {}

  static criar(entrada: string): Documento {
    const apenasDigitos = entrada.replace(/\D/g, '');

    if (apenasDigitos.length !== 11 && apenasDigitos.length !== 14) {
      throw new DomainValidationError(
        'Documento inválido: informe um CPF (11 dígitos) ou CNPJ (14 dígitos), com ou sem máscara.',
      );
    }
    if (/^(\d)\1+$/.test(apenasDigitos)) {
      throw new DomainValidationError(
        'Documento inválido: os dígitos não podem ser todos iguais. Informe um CPF/CNPJ válido.',
      );
    }

    return new Documento(apenasDigitos);
  }

  /** Reconstrói a partir da persistência (valor já validado). */
  static restaurar(valor: string): Documento {
    return new Documento(valor);
  }

  get valor(): string {
    return this.digitos;
  }

  get tipo(): 'CPF' | 'CNPJ' {
    return this.digitos.length === 11 ? 'CPF' : 'CNPJ';
  }

  igualA(outro: Documento): boolean {
    return this.digitos === outro.digitos;
  }
}
