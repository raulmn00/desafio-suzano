import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/infrastructure/public.decorator';

interface RespostaHealth {
  status: 'ok';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verifica se a API está no ar.' })
  @ApiOkResponse({ description: 'API operacional.' })
  verificar(): RespostaHealth {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
