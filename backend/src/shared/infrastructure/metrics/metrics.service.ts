import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

/**
 * Registry Prometheus isolado (não usa o registry global, evitando conflitos de
 * registro entre instâncias/testes). Expõe métricas padrão do processo + as
 * métricas HTTP de requisições e latência.
 */
@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly requisicoesTotal: Counter<string>;
  private readonly duracaoSegundos: Histogram<string>;
  private readonly eventosNegocio: Counter<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    const labelNames = ['method', 'route', 'status_code'];
    this.requisicoesTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total de requisições HTTP por método, rota e status.',
      labelNames,
      registers: [this.registry],
    });
    this.duracaoSegundos = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos.',
      labelNames,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
    this.eventosNegocio = new Counter({
      name: 'ordens_venda_eventos_total',
      help: 'Eventos de negócio de Ordens de Venda por tipo (alimentado por handlers de domínio).',
      labelNames: ['tipo'],
      registers: [this.registry],
    });
  }

  registrar(method: string, route: string, statusCode: number, duracaoSegundos: number): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.requisicoesTotal.inc(labels);
    this.duracaoSegundos.observe(labels, duracaoSegundos);
  }

  /** Incrementa um contador de evento de negócio (ex.: 'criada', 'entregue'). */
  registrarEventoNegocio(tipo: string): void {
    this.eventosNegocio.inc({ tipo });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  coletar(): Promise<string> {
    return this.registry.metrics();
  }
}
