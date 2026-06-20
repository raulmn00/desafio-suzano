import type { Options } from 'pino-http';
import { opcoesLogger } from './logger.config';

function pinoHttp(env: NodeJS.ProcessEnv): Options {
  return opcoesLogger(env).pinoHttp as Options;
}

describe('opcoesLogger', () => {
  it('usa LOG_LEVEL quando definido', () => {
    expect(pinoHttp({ LOG_LEVEL: 'debug', NODE_ENV: 'production' }).level).toBe('debug');
  });

  it('nível padrão é info em produção e silent em teste', () => {
    expect(pinoHttp({ NODE_ENV: 'production' }).level).toBe('info');
    expect(pinoHttp({ NODE_ENV: 'test' }).level).toBe('silent');
  });

  it('redige segredos (authorization, senha, refreshToken, accessToken)', () => {
    const redact = pinoHttp({}).redact as { paths: string[] };
    expect(redact.paths).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.body.senha',
        'req.body.refreshToken',
        'req.body.accessToken',
      ]),
    );
  });

  it('usa transport pino-pretty apenas em desenvolvimento', () => {
    expect(pinoHttp({ NODE_ENV: 'development' }).transport).toMatchObject({
      target: 'pino-pretty',
    });
    expect(pinoHttp({ NODE_ENV: 'production' }).transport).toBeUndefined();
    expect(pinoHttp({ NODE_ENV: 'test' }).transport).toBeUndefined();
  });

  it('genReqId resolve o id e ecoa no header da resposta', () => {
    const setHeader = jest.fn();
    const genReqId = pinoHttp({}).genReqId as (req: unknown, res: unknown) => string;
    const id = genReqId({ headers: { 'x-request-id': 'r-1' } }, { setHeader });
    expect(id).toBe('r-1');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'r-1');
  });

  it('customLogLevel mapeia 5xx→error, 4xx→warn, sucesso→info, erro→error', () => {
    const fn = pinoHttp({}).customLogLevel as (
      req: unknown,
      res: { statusCode: number },
      err?: unknown,
    ) => string;
    expect(fn({}, { statusCode: 500 })).toBe('error');
    expect(fn({}, { statusCode: 403 })).toBe('warn');
    expect(fn({}, { statusCode: 200 })).toBe('info');
    expect(fn({}, { statusCode: 200 }, new Error('x'))).toBe('error');
  });

  it('customProps expõe userId e papel do usuário autenticado', () => {
    const fn = pinoHttp({}).customProps as (req: unknown) => Record<string, unknown>;
    expect(fn({ user: { id: 'u1', papel: 'OPERADOR' } })).toMatchObject({
      userId: 'u1',
      papel: 'OPERADOR',
    });
    expect(fn({})).toMatchObject({ userId: undefined, papel: undefined });
  });
});
