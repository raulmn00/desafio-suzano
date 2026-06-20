import { CallHandler, ExecutionContext } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { of } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

function contexto(req: object, res: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

const next: CallHandler = { handle: () => of('ok') };

describe('MetricsInterceptor', () => {
  it('registra método/rota/status e duração ao finalizar a resposta', (done) => {
    const metrics = { registrar: jest.fn() } as unknown as MetricsService;
    const interceptor = new MetricsInterceptor(metrics);
    const res = Object.assign(new EventEmitter(), { statusCode: 201 });
    const ctx = contexto({ method: 'POST', baseUrl: '/api/v1', route: { path: '/itens' } }, res);

    interceptor.intercept(ctx, next).subscribe(() => {
      res.emit('finish');
      expect(metrics.registrar).toHaveBeenCalledWith(
        'POST',
        '/api/v1/itens',
        201,
        expect.any(Number),
      );
      done();
    });
  });

  it('não contabiliza o próprio /metrics', (done) => {
    const metrics = { registrar: jest.fn() } as unknown as MetricsService;
    const interceptor = new MetricsInterceptor(metrics);
    const res = Object.assign(new EventEmitter(), { statusCode: 200 });
    const ctx = contexto({ method: 'GET', baseUrl: '', route: { path: '/metrics' } }, res);

    interceptor.intercept(ctx, next).subscribe(() => {
      res.emit('finish');
      expect(metrics.registrar).not.toHaveBeenCalled();
      done();
    });
  });
});
