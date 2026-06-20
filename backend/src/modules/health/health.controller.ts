import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/infrastructure/public.decorator';
import { HealthService } from './health.service';

interface RespostaHealth {
  status: 'ok';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness: verifica se o processo está no ar.' })
  @ApiOkResponse({ description: 'API operacional.' })
  verificar(): RespostaHealth {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness: pronto para tráfego (checa o banco). 503 se indisponível.' })
  readiness(): Promise<{ status: 'ready'; timestamp: string }> {
    return this.health.readiness();
  }
}
