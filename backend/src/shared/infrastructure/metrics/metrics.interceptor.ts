import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ServerResponse } from 'node:http';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';
import { rotaDaRequisicao } from './rota-requisicao';

/**
 * Mede toda requisição HTTP e alimenta as métricas Prometheus. Usa o evento
 * `finish` da resposta para capturar o status final (inclusive erros tratados
 * pelo filtro) e o tempo total. Ignora o próprio `/metrics`.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method: string; baseUrl?: string; route?: { path?: string } }>();
    const res = http.getResponse<ServerResponse>();
    const inicio = process.hrtime.bigint();

    res.once('finish', () => {
      const rota = rotaDaRequisicao(req);
      if (rota === '/metrics') {
        return;
      }
      const duracaoSegundos = Number(process.hrtime.bigint() - inicio) / 1e9;
      this.metrics.registrar(req.method, rota, res.statusCode, duracaoSegundos);
    });

    return next.handle();
  }
}
