import type { IncomingHttpHeaders, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { REQUEST_ID_HEADER, resolverRequestId } from './request-id';

interface ReqComUsuario {
  headers: IncomingHttpHeaders;
  user?: { id?: string; papel?: string };
}

/**
 * Opções do logger estruturado (pino) para o nestjs-pino `LoggerModule`.
 * Centraliza correlation-id, redação de segredos, níveis e formato (JSON em
 * prod/test; pino-pretty legível em desenvolvimento).
 */
export function opcoesLogger(env: NodeJS.ProcessEnv): Params {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const ehDesenvolvimento = nodeEnv === 'development';
  const nivelPadrao = nodeEnv === 'test' ? 'silent' : 'info';

  return {
    pinoHttp: {
      level: env.LOG_LEVEL ?? nivelPadrao,

      // Correlation id: usa x-request-id recebido ou gera, e ecoa na resposta.
      genReqId: (req, res) => {
        const id = resolverRequestId((req as ReqComUsuario).headers);
        (res as ServerResponse).setHeader(REQUEST_ID_HEADER, id);
        return id;
      },

      // Nunca logar segredos.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.body.senha',
          'req.body.refreshToken',
          'req.body.accessToken',
        ],
        censor: '[Redacted]',
      },

      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },

      // Enriquecimento: quem fez a requisição (preenchido após o guard de auth).
      customProps: (req) => {
        const user = (req as ReqComUsuario).user;
        return { userId: user?.id, papel: user?.papel };
      },

      transport: ehDesenvolvimento
        ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } }
        : undefined,
    },
  };
}
