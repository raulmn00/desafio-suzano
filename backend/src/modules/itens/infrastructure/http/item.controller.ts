import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/infrastructure/roles.decorator';
import { PapelUsuario } from '../../../auth/domain/papel-usuario';
import { ConsultarItemPorIdUseCase } from '../../application/use-cases/consultar-item-por-id.use-case';
import { ConsultarItensUseCase } from '../../application/use-cases/consultar-itens.use-case';
import { CriarItemUseCase } from '../../application/use-cases/criar-item.use-case';
import { ItemView } from '../../application/item.presenter';
import { CriarItemDto } from './criar-item.dto';

@ApiTags('itens')
@ApiBearerAuth()
@Controller('itens')
export class ItemController {
  constructor(
    private readonly criarUseCase: CriarItemUseCase,
    private readonly consultarTodosUseCase: ConsultarItensUseCase,
    private readonly consultarPorIdUseCase: ConsultarItemPorIdUseCase,
  ) {}

  @Post()
  @Roles(PapelUsuario.OPERADOR)
  @ApiOperation({ summary: 'Cadastra um novo item.' })
  criar(@Body() dto: CriarItemDto): Promise<ItemView> {
    return this.criarUseCase.executar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os itens.' })
  listar(): Promise<ItemView[]> {
    return this.consultarTodosUseCase.executar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um item por id.' })
  obter(@Param('id') id: string): Promise<ItemView> {
    return this.consultarPorIdUseCase.executar(id);
  }
}
