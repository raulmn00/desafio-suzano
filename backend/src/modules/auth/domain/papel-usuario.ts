/**
 * Papéis de autorização (RBAC). Espelha o enum `PapelUsuario` do Prisma.
 * - OPERADOR: opera cadastros, ordens de venda e agendamentos (escrita).
 * - AUDITOR: acesso somente leitura, incluindo a trilha de auditoria.
 */
export enum PapelUsuario {
  OPERADOR = 'OPERADOR',
  AUDITOR = 'AUDITOR',
}
