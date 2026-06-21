import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PapelUsuario } from '../../../auth/domain/papel-usuario';
import { Roles } from '../../../auth/infrastructure/roles.decorator';
import { ConsultarAuditoriaUseCase } from '../../application/use-cases/consultar-auditoria.use-case';
import { AuditEventView } from '../../application/audit-event.presenter';
import { Pagina, resolverPaginacao } from '../../../../shared/domain/pagination';
import { FiltrosAuditoriaDto } from './filtros-auditoria.dto';

@ApiTags('auditoria')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly consultarUseCase: ConsultarAuditoriaUseCase) {}

  @Get()
  @Roles(PapelUsuario.AUDITOR, PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Consulta a trilha de auditoria (filtros: entidade, ação, período).' })
  consultar(@Query() filtros: FiltrosAuditoriaDto): Promise<Pagina<AuditEventView>> {
    return this.consultarUseCase.executar(
      {
        entidadeTipo: filtros.entidadeTipo,
        entidadeId: filtros.entidadeId,
        acao: filtros.acao,
        ocorridoDe: filtros.ocorridoDe ? new Date(filtros.ocorridoDe) : undefined,
        ocorridoAte: filtros.ocorridoAte ? new Date(filtros.ocorridoAte) : undefined,
      },
      resolverPaginacao(filtros.page, filtros.limit),
    );
  }
}
