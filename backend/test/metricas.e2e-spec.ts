import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';

/**
 * Métricas (Prometheus) e health liveness/readiness ponta a ponta.
 */
describe('OVGS API — Métricas & monitoramento (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('liveness /health → 200', () => request(server).get('/health').expect(200));

  it('readiness /health/ready → 200 (banco respondendo)', async () => {
    const res = await request(server).get('/health/ready').expect(200);
    expect(res.body.status).toBe('ready');
  });

  it('/metrics expõe formato Prometheus com métricas de processo e HTTP', async () => {
    // gera tráfego para popular os contadores
    await request(server).get('/health');
    await request(server).get('/api/v1/clientes').expect(401);

    const res = await request(server).get('/metrics').expect(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds_bucket');
    // a rota é o padrão (não a URL com ids), e o /metrics não se autocontabiliza
    expect(res.text).toMatch(/http_requests_total\{[^}]*route="[^"]+"/);
    expect(res.text).not.toMatch(/route="\/metrics"/);
  });

  it('/metrics é público (sem token)', () => request(server).get('/metrics').expect(200));
});
