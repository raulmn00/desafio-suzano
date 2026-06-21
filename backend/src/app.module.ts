import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { opcoesLogger } from './shared/infrastructure/logging/logger.config';
import { MetricsModule } from './shared/infrastructure/metrics/metrics.module';
import { validateEnv } from './shared/infrastructure/config/env.validation';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { HealthModule } from './modules/health/health.module';
import { ItensModule } from './modules/itens/itens.module';
import { OrdensVendaModule } from './modules/ordens-venda/ordens-venda.module';
import { TiposTransporteModule } from './modules/tipos-transporte/tipos-transporte.module';
import { SharedModule } from './shared/infrastructure/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot(opcoesLogger(process.env)),
    EventEmitterModule.forRoot(),
    // Rate-limit global por IP (coarse anti-DoS). O login tem um teto mais
    // estrito via @Throttle no controller. Armazenamento in-memory (por
    // instância) — ver README p/ a evolução com storage Redis distribuído.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: Number(config.get<string>('THROTTLE_TTL') ?? '60000'),
            limit: Number(config.get<string>('THROTTLE_LIMIT') ?? '300'),
          },
        ],
      }),
    }),
    SharedModule,
    MetricsModule,
    AuthModule,
    HealthModule,
    TiposTransporteModule,
    ItensModule,
    ClientesModule,
    OrdensVendaModule,
    AuditoriaModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
