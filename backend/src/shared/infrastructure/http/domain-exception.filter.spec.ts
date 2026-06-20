import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  DomainValidationError,
  NotFoundError,
  UnauthorizedError,
} from '../../domain/domain-error';
import { DomainExceptionFilter } from './domain-exception.filter';

class ErroDominioGenerico extends DomainError {
  readonly code = 'GENERICO';
}

function criarHost(): {
  host: ArgumentsHost;
  res: { status: jest.Mock; json: jest.Mock };
} {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('mapeia NotFoundError para 404', () => {
    const { host, res } = criarHost();

    filter.catch(new NotFoundError('não achei'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: 'NOT_FOUND', message: 'não achei' }),
    );
  });

  it('mapeia ConflictError para 409', () => {
    const { host, res } = criarHost();

    filter.catch(new ConflictError('duplicado'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CONFLICT' }));
  });

  it('mapeia UnauthorizedError para 401', () => {
    const { host, res } = criarHost();

    filter.catch(new UnauthorizedError('credenciais inválidas'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  it('mapeia BusinessRuleError para 422', () => {
    const { host, res } = criarHost();

    filter.catch(new BusinessRuleError('regra'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'BUSINESS_RULE' }));
  });

  it('mapeia DomainValidationError para 422', () => {
    const { host, res } = criarHost();

    filter.catch(new DomainValidationError('inválido'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DOMAIN_VALIDATION' }));
  });

  it('mapeia DomainError genérico para 422', () => {
    const { host, res } = criarHost();

    filter.catch(new ErroDominioGenerico('outro'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'GENERICO' }));
  });

  it('repassa HttpException com resposta string', () => {
    const { host, res } = criarHost();

    filter.catch(new HttpException('proibido', HttpStatus.FORBIDDEN), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HTTP_EXCEPTION', message: 'proibido' }),
    );
  });

  it('repassa HttpException com resposta objeto e message array (validação)', () => {
    const { host, res } = criarHost();

    filter.catch(
      new HttpException({ message: ['campo a obrigatório', 'campo b inválido'] }, HttpStatus.BAD_REQUEST),
      host,
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'campo a obrigatório; campo b inválido' }),
    );
  });

  it('repassa HttpException com resposta objeto sem message (usa exception.message)', () => {
    const { host, res } = criarHost();

    filter.catch(new HttpException({ erro: 'x' }, HttpStatus.BAD_REQUEST), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HTTP_EXCEPTION', message: expect.any(String) }),
    );
  });

  it('degrada erro inesperado (Error) para 500 e loga', () => {
    const { host, res } = criarHost();
    const spy = jest.spyOn(Logger.prototype, 'error');

    filter.catch(new Error('boom'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INTERNAL_ERROR' }));
    expect(spy).toHaveBeenCalled();
  });

  it('degrada valor não-Error para 500', () => {
    const { host, res } = criarHost();

    filter.catch('string solta', host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INTERNAL_ERROR' }));
  });
});
