import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PapelUsuario } from '../../../auth/domain/papel-usuario';
import { Roles } from '../../../auth/infrastructure/roles.decorator';
import { AutorizarTipoTransporteUseCase } from '../../application/use-cases/autorizar-tipo-transporte.use-case';
import { ConsultarClientePorIdUseCase } from '../../application/use-cases/consultar-cliente-por-id.use-case';
import { ConsultarClientesUseCase } from '../../application/use-cases/consultar-clientes.use-case';
import { CriarClienteUseCase } from '../../application/use-cases/criar-cliente.use-case';
import { DesautorizarTipoTransporteUseCase } from '../../application/use-cases/desautorizar-tipo-transporte.use-case';
import { EditarClienteUseCase } from '../../application/use-cases/editar-cliente.use-case';
import { ClienteView } from '../../application/cliente.presenter';
import { AutorizarTipoTransporteDto } from './autorizar-tipo-transporte.dto';
import { CriarClienteDto } from './criar-cliente.dto';
import { EditarClienteDto } from './editar-cliente.dto';

@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly criarUseCase: CriarClienteUseCase,
    private readonly editarUseCase: EditarClienteUseCase,
    private readonly consultarTodosUseCase: ConsultarClientesUseCase,
    private readonly consultarPorIdUseCase: ConsultarClientePorIdUseCase,
    private readonly autorizarUseCase: AutorizarTipoTransporteUseCase,
    private readonly desautorizarUseCase: DesautorizarTipoTransporteUseCase,
  ) {}

  @Post()
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Cadastra um novo cliente.' })
  criar(@Body() dto: CriarClienteDto): Promise<ClienteView> {
    return this.criarUseCase.executar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os clientes.' })
  listar(): Promise<ClienteView[]> {
    return this.consultarTodosUseCase.executar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um cliente por id.' })
  obter(@Param('id') id: string): Promise<ClienteView> {
    return this.consultarPorIdUseCase.executar(id);
  }

  @Patch(':id')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Edita nome e/ou documento de um cliente.' })
  editar(@Param('id') id: string, @Body() dto: EditarClienteDto): Promise<ClienteView> {
    return this.editarUseCase.executar({ id, ...dto });
  }

  @Post(':id/transportes')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Autoriza um tipo de transporte para o cliente.' })
  autorizar(@Param('id') id: string, @Body() dto: AutorizarTipoTransporteDto): Promise<ClienteView> {
    return this.autorizarUseCase.executar({ clienteId: id, tipoTransporteId: dto.tipoTransporteId });
  }

  @Delete(':id/transportes/:tipoTransporteId')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Remove a autorização de um tipo de transporte do cliente.' })
  desautorizar(
    @Param('id') id: string,
    @Param('tipoTransporteId') tipoTransporteId: string,
  ): Promise<ClienteView> {
    return this.desautorizarUseCase.executar({ clienteId: id, tipoTransporteId });
  }
}
