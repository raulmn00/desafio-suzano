/** Port de comparação de senha (texto plano vs hash). Implementado com bcrypt. */
export abstract class HashComparer {
  abstract comparar(textoPlano: string, hash: string): Promise<boolean>;
}
