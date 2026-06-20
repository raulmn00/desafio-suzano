// Carrega as variáveis de ambiente reais (.env) para os testes e2e, que rodam
// contra um PostgreSQL de verdade (docker compose).
import { config } from 'dotenv';

config();

process.env.JWT_SECRET ??= 'dev-secret';
process.env.JWT_EXPIRES_IN ??= '1d';
