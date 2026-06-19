/**
 * Port de unidade de trabalho. Executa um bloco de trabalho dentro de uma
 * transação atômica. Permite que um use-case persista a mudança de estado e o
 * evento de auditoria de forma "tudo ou nada", sem acoplar o use-case ao ORM.
 */
export abstract class TransactionManager {
  abstract executar<T>(trabalho: () => Promise<T>): Promise<T>;
}
