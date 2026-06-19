import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { TiposTransporteModule } from './modules/tipos-transporte/tipos-transporte.module';
import { SharedModule } from './shared/infrastructure/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    HealthModule,
    TiposTransporteModule,
  ],
})
export class AppModule {}
