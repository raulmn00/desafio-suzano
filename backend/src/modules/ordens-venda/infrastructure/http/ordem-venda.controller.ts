import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtorAtual } from '../../../auth/infrastructure/ator-atual.decorator';
import { PapelUsuario } from '../../../auth/domain/papel-usuario';
import { Roles } from '../../../auth/infrastructure/roles.decorator';
import { AlterarTransporteUseCase } from '../../application/use-cases/alterar-transporte.use-case';
import { AtualizarStatusUseCase } from '../../application/use-cases/atualizar-status.use-case';
import { ConsultarOrdemPorIdUseCase } from '../../application/use-cases/consultar-ordem-por-id.use-case';
import { ConsultarOrdensUseCase } from '../../application/use-cases/consultar-ordens.use-case';
import { CriarOrdemVendaUseCase } from '../../application/use-cases/criar-ordem-venda.use-case';
import { OrdemVendaView } from '../../application/ordem-venda.presenter';
import { AlterarTransporteDto } from './alterar-transporte.dto';
import { AtualizarStatusDto } from './atualizar-status.dto';
import { CriarOrdemVendaDto } from './criar-ordem-venda.dto';
import { FiltrosOrdemVendaDto } from './filtros-ordem-venda.dto';

@ApiTags('ordens-venda')
@ApiBearerAuth()
@Controller('ordens-venda')
export class OrdemVendaController {
  constructor(
    private readonly criarUseCase: CriarOrdemVendaUseCase,
    private readonly consultarUseCase: ConsultarOrdensUseCase,
    private readonly consultarPorIdUseCase: ConsultarOrdemPorIdUseCase,
    private readonly atualizarStatusUseCase: AtualizarStatusUseCase,
    private readonly alterarTransporteUseCase: AlterarTransporteUseCase,
  ) {}

  @Post()
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Cria uma ordem de venda.' })
  criar(@Body() dto: CriarOrdemVendaDto, @AtorAtual() ator: string): Promise<OrdemVendaView> {
    return this.criarUseCase.executar({ ...dto, ator });
  }

  @Get()
  @ApiOperation({
    summary: 'Monitoramento: lista ordens com filtros (status, cliente, transporte, período).',
  })
  listar(@Query() filtros: FiltrosOrdemVendaDto): Promise<OrdemVendaView[]> {
    return this.consultarUseCase.executar({
      status: filtros.status,
      clienteId: filtros.clienteId,
      tipoTransporteId: filtros.tipoTransporteId,
      criadoDe: filtros.criadoDe ? new Date(filtros.criadoDe) : undefined,
      criadoAte: filtros.criadoAte ? new Date(filtros.criadoAte) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma ordem de venda.' })
  obter(@Param('id') id: string): Promise<OrdemVendaView> {
    return this.consultarPorIdUseCase.executar(id);
  }

  @Patch(':id/status')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Atualiza o status (apenas transições válidas do fluxo).' })
  atualizarStatus(
    @Param('id') id: string,
    @Body() dto: AtualizarStatusDto,
    @AtorAtual() ator: string,
  ): Promise<OrdemVendaView> {
    return this.atualizarStatusUseCase.executar({ id, status: dto.status, ator });
  }

  @Patch(':id/transporte')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Altera o tipo de transporte (revalida autorização do cliente).' })
  alterarTransporte(
    @Param('id') id: string,
    @Body() dto: AlterarTransporteDto,
    @AtorAtual() ator: string,
  ): Promise<OrdemVendaView> {
    return this.alterarTransporteUseCase.executar({
      id,
      tipoTransporteId: dto.tipoTransporteId,
      ator,
    });
  }
}
