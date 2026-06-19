/**
 * Variáveis de ambiente mínimas para os testes unitários. Não conectam a banco
 * algum — apenas satisfazem o construtor do PrismaClient e do JWT em testes que
 * instanciam esses adaptadores sem subir a aplicação completa.
 */
process.env.DATABASE_URL ??= 'postgresql://ovgs:ovgs@localhost:5432/ovgs?schema=public';
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
process.env.JWT_SECRET ??= 'test-secret';
process.env.JWT_EXPIRES_IN ??= '1d';
