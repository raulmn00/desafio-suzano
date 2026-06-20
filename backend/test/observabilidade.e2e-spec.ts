import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';

/**
 * Observabilidade: cada resposta carrega um correlation id (`x-request-id`),
 * gerado quando ausente e ecoado quando recebido (propagação entre serviços).
 */
describe('OVGS API — Observabilidade (e2e)', () => {
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

  it('gera um x-request-id quando o cliente não envia', async () => {
    const res = await request(server).get('/health').expect(200);
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('ecoa o x-request-id recebido (correlação entre serviços)', async () => {
    const res = await request(server)
      .get('/health')
      .set('x-request-id', 'trace-abc-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('trace-abc-123');
  });

  it('o middleware de logging não interfere na autenticação (401 segue 401)', () =>
    request(server).get('/api/v1/clientes').expect(401));
});
