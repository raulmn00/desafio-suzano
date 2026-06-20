import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    AuthModule,
    HealthModule,
    TiposTransporteModule,
    ItensModule,
    ClientesModule,
    OrdensVendaModule,
    AuditoriaModule,
  ],
})
export class AppModule {}
