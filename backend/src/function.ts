import 'reflect-metadata';
import { http } from '@google-cloud/functions-framework';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

/**
 * Handler para Cloud Run function (gen2) via functions-framework.
 *
 * A app NestJS é inicializada UMA ÚNICA VEZ (no primeiro request frio) sobre uma
 * instância Express compartilhada, e reaproveitada nas invocações seguintes —
 * evitando reinicializar o container de DI a cada request. Não chamamos
 * `app.listen`: o functions-framework é quem escuta a porta.
 */
const server = express();
let inicializacao: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
  });
  configurarApp(app);
  await app.init();
}

http('ovgs', async (req, res) => {
  if (!inicializacao) {
    inicializacao = bootstrap();
  }
  await inicializacao;
  server(req, res);
});
