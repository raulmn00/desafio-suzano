import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtorAtual } from '../../../auth/infrastructure/ator-atual.decorator';
import { PapelUsuario } from '../../../auth/domain/papel-usuario';
import { Roles } from '../../../auth/infrastructure/roles.decorator';
import { ConfirmarAgendamentoUseCase } from '../../application/use-cases/confirmar-agendamento.use-case';
import { DefinirAgendamentoUseCase } from '../../application/use-cases/definir-agendamento.use-case';
import { ReagendarUseCase } from '../../application/use-cases/reagendar.use-case';
import { OrdemVendaView } from '../../application/ordem-venda.presenter';
import { AgendamentoDto } from './agendamento.dto';

@ApiTags('agendamentos')
@ApiBearerAuth()
@Controller('ordens-venda/:id/agendamento')
export class AgendamentoController {
  constructor(
    private readonly definirUseCase: DefinirAgendamentoUseCase,
    private readonly confirmarUseCase: ConfirmarAgendamentoUseCase,
    private readonly reagendarUseCase: ReagendarUseCase,
  ) {}

  @Post()
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Define a data de entrega e a janela de atendimento.' })
  definir(
    @Param('id') id: string,
    @Body() dto: AgendamentoDto,
    @AtorAtual() ator: string,
  ): Promise<OrdemVendaView> {
    return this.definirUseCase.executar({
      id,
      dataEntrega: new Date(dto.dataEntrega),
      janelaInicio: dto.janelaInicio,
      janelaFim: dto.janelaFim,
      ator,
    });
  }

  @Post('confirmar')
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Confirma o agendamento.' })
  confirmar(@Param('id') id: string, @AtorAtual() ator: string): Promise<OrdemVendaView> {
    return this.confirmarUseCase.executar({ id, ator });
  }

  @Patch()
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Reagenda (exige nova confirmação).' })
  reagendar(
    @Param('id') id: string,
    @Body() dto: AgendamentoDto,
    @AtorAtual() ator: string,
  ): Promise<OrdemVendaView> {
    return this.reagendarUseCase.executar({
      id,
      dataEntrega: new Date(dto.dataEntrega),
      janelaInicio: dto.janelaInicio,
      janelaFim: dto.janelaFim,
      ator,
    });
  }
}
