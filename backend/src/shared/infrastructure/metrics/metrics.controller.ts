import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../modules/auth/infrastructure/public.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('observabilidade')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Métricas no formato Prometheus (processo + HTTP).' })
  coletar(): Promise<string> {
    return this.metrics.coletar();
  }
}
