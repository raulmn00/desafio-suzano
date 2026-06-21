// Carrega as variáveis de ambiente reais (.env) para os testes e2e, que rodam
// contra um PostgreSQL de verdade (docker compose).
import { config } from 'dotenv';

config();

process.env.JWT_SECRET ??= 'dev-secret';
process.env.JWT_EXPIRES_IN ??= '1d';

// Afrouxa o rate-limit GLOBAL na suíte e2e (que faz muitas requisições por
// instância). O teto estrito do /auth/login (10/min, no controller) continua
// valendo e é exercido pelo spec de hardening.
process.env.THROTTLE_LIMIT ??= '100000';
