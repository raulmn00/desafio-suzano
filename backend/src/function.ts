import './instrument'; // Sentry: deve vir antes de tudo
import 'reflect-metadata';
import { http } from '@google-cloud/functions-framework';
import { NestFactory } from '@nestjs/core';
import type { Express } from 'express';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

/**
 * Handler para Cloud Run function (gen2) via functions-framework.
 *
 * A app NestJS é inicializada UMA ÚNICA VEZ (no primeiro request frio) e
 * reaproveitada nas invocações seguintes. Usamos o ExpressAdapter padrão do
 * NestFactory (em vez de criar um `express()` manualmente) — o Nest 11 o
 * configura corretamente para o Express 5; só então pegamos a instância Express
 * para repassar (req, res). Não chamamos `app.listen`: quem escuta é o
 * functions-framework.
 */
let inicializacao: Promise<Express> | null = null;

async function bootstrap(): Promise<Express> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(PinoLogger)); // logs estruturados (JSON) → Cloud Logging
  configurarApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance() as Express;
}

http('ovgs', async (req, res) => {
  inicializacao ??= bootstrap();
  const server = await inicializacao;
  server(req, res);
});
