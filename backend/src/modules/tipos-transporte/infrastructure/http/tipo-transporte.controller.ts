import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/infrastructure/roles.decorator';
import { PapelUsuario } from '../../../auth/domain/papel-usuario';
import { ConsultarTipoTransportePorIdUseCase } from '../../application/use-cases/consultar-tipo-transporte-por-id.use-case';
import { ConsultarTiposTransporteUseCase } from '../../application/use-cases/consultar-tipos-transporte.use-case';
import { CriarTipoTransporteUseCase } from '../../application/use-cases/criar-tipo-transporte.use-case';
import { EditarTipoTransporteUseCase } from '../../application/use-cases/editar-tipo-transporte.use-case';
import { TipoTransporteView } from '../../application/tipo-transporte.presenter';
import { CriarTipoTransporteDto } from './criar-tipo-transporte.dto';
import { EditarTipoTransporteDto } from './editar-tipo-transporte.dto';

@ApiTags('tipos-transporte')
@ApiBearerAuth()
@Controller('tipos-transporte')
export class TipoTransporteController {
  constructor(
    private readonly criarUseCase: CriarTipoTransporteUseCase,
    private readonly editarUseCase: EditarTipoTransporteUseCase,
    private readonly consultarTodosUseCase: ConsultarTiposTransporteUseCase,
    private readonly consultarPorIdUseCase: ConsultarTipoTransportePorIdUseCase,
  ) {}

  @Post()
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Cadastra um novo tipo de transporte.' })
  criar(@Body() dto: CriarTipoTransporteDto): Promise<TipoTransporteView> {
    return this.criarUseCase.executar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os tipos de transporte.' })
  listar(): Promise<TipoTransporteView[]> {
    return this.consultarTodosUseCase.executar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um tipo de transporte por id.' })
  obter(@Param('id') id: string): Promise<TipoTransporteView> {
    return this.consultarPorIdUseCase.executar(id);
  }

  @Patch(':id')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Edita um tipo de transporte existente.' })
  editar(
    @Param('id') id: string,
    @Body() dto: EditarTipoTransporteDto,
  ): Promise<TipoTransporteView> {
    return this.editarUseCase.executar({ id, ...dto });
  }
}
