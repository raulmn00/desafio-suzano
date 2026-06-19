import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter';

/**
 * Configuração compartilhada entre o bootstrap de desenvolvimento (`main.ts`)
 * e o handler serverless da Cloud Run gen2 (`function.ts`). Concentra: prefixo
 * de rota, validação de entrada, filtro de exceções, CORS e Swagger.
 */
export function configurarApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  const origens = (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origens.includes('*') ? true : origens,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  configurarSwagger(app);
}

function configurarSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('OVGS — Gestão de Ordens de Venda')
    .setDescription(
      'API REST para o ciclo de vida de Ordens de Venda: cadastros, criação e ' +
        'acompanhamento de OVs, central de agendamento e auditoria.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e emissão de token')
    .addTag('clientes', 'Cadastro de clientes e transportes autorizados')
    .addTag('tipos-transporte', 'Cadastro de modalidades de transporte')
    .addTag('itens', 'Catálogo de itens')
    .addTag('ordens-venda', 'Gestão e monitoramento de Ordens de Venda')
    .addTag('agendamentos', 'Central de agendamento de entregas')
    .addTag('auditoria', 'Trilha de auditoria')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
