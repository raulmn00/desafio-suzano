import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientesModule } from './modules/clientes/clientes.module';
import { HealthModule } from './modules/health/health.module';
import { ItensModule } from './modules/itens/itens.module';
import { TiposTransporteModule } from './modules/tipos-transporte/tipos-transporte.module';
import { SharedModule } from './shared/infrastructure/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    HealthModule,
    TiposTransporteModule,
    ItensModule,
    ClientesModule,
  ],
})
export class AppModule {}
