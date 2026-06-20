import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';

export class AtualizarStatusDto {
  @ApiProperty({ enum: StatusOrdemVenda, description: 'Novo status (apenas transições válidas).' })
  @IsEnum(StatusOrdemVenda)
  status!: StatusOrdemVenda;
}
