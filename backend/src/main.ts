import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

/** Bootstrap de desenvolvimento/produção tradicional (servidor HTTP de longa duração). */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port);

  Logger.log(`OVGS API ouvindo em http://localhost:${port} (docs em /docs)`, 'Bootstrap');
}

void bootstrap();
