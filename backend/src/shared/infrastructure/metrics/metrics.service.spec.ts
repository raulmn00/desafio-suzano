import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('expõe métricas padrão do processo (process_*)', async () => {
    const out = await new MetricsService().coletar();
    expect(out).toContain('process_cpu_user_seconds_total');
    expect(out).toMatch(/nodejs_/);
  });

  it('conta requisições por método/rota/status e observa a duração', async () => {
    const m = new MetricsService();
    m.registrar('GET', '/api/v1/clientes', 200, 0.012);
    m.registrar('GET', '/api/v1/clientes', 200, 0.02);

    const out = await m.coletar();
    expect(out).toMatch(
      /http_requests_total\{method="GET",route="\/api\/v1\/clientes",status_code="200"\} 2/,
    );
    expect(out).toContain('http_request_duration_seconds_bucket');
  });

  it('expõe o content-type do Prometheus', () => {
    expect(new MetricsService().contentType).toContain('text/plain');
  });

  it('conta eventos de negócio por tipo', async () => {
    const m = new MetricsService();
    m.registrarEventoNegocio('criada');
    m.registrarEventoNegocio('criada');
    m.registrarEventoNegocio('entregue');

    const out = await m.coletar();
    expect(out).toMatch(/ordens_venda_eventos_total\{tipo="criada"\} 2/);
    expect(out).toMatch(/ordens_venda_eventos_total\{tipo="entregue"\} 1/);
  });
});
