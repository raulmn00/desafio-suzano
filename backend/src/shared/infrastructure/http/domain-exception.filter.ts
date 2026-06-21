import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  DomainValidationError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../domain/domain-error';

interface CorpoErro {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
}

/**
 * Filtro único de borda: traduz erros de domínio em respostas HTTP coerentes,
 * deixa `HttpException` do Nest passar com seu status, e degrada qualquer erro
 * inesperado para 500 sem vazar detalhes internos.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, code, message } = this.resolver(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }

    const corpo: CorpoErro = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(corpo);
  }

  private resolver(exception: unknown): { status: number; code: string; message: string } {
    if (exception instanceof NotFoundError) {
      return { status: HttpStatus.NOT_FOUND, code: exception.code, message: exception.message };
    }
    if (exception instanceof ConflictError) {
      return { status: HttpStatus.CONFLICT, code: exception.code, message: exception.message };
    }
    if (exception instanceof UnauthorizedError) {
      return { status: HttpStatus.UNAUTHORIZED, code: exception.code, message: exception.message };
    }
    if (exception instanceof ForbiddenError) {
      return { status: HttpStatus.FORBIDDEN, code: exception.code, message: exception.message };
    }
    if (exception instanceof BusinessRuleError || exception instanceof DomainValidationError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: exception.code,
        message: exception.message,
      };
    }
    if (exception instanceof DomainError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: exception.code,
        message: exception.message,
      };
    }
    if (exception instanceof HttpException) {
      const resposta = exception.getResponse();
      const message =
        typeof resposta === 'string'
          ? resposta
          : ((resposta as { message?: string | string[] }).message ?? exception.message);
      return {
        status: exception.getStatus(),
        code: 'HTTP_EXCEPTION',
        message: Array.isArray(message) ? message.join('; ') : message,
      };
    }
    // Erros estilo `http-errors` lançados por middleware do Express (ex.: o
    // body-parser quando o corpo excede o limite → 413). Têm `status`/`statusCode`.
    const erroHttp = this.comoErroHttp(exception);
    if (erroHttp) {
      return erroHttp;
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno inesperado.',
    };
  }

  private comoErroHttp(
    exception: unknown,
  ): { status: number; code: string; message: string } | null {
    const e = exception as {
      status?: unknown;
      statusCode?: unknown;
      message?: unknown;
      expose?: unknown;
    };
    const status =
      typeof e?.status === 'number'
        ? e.status
        : typeof e?.statusCode === 'number'
          ? e.statusCode
          : undefined;
    if (status === undefined || status < 400 || status > 599) {
      return null;
    }
    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return {
        status,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Corpo da requisição excede o tamanho máximo permitido.',
      };
    }
    const expoe = e.expose === true && typeof e.message === 'string';
    return {
      status,
      code: 'HTTP_ERROR',
      message: expoe ? (e.message as string) : 'Erro ao processar a requisição.',
    };
  }
}
