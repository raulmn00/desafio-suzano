import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FiltrosAuditoriaDto {
  @ApiPropertyOptional({ example: 'ORDEM_VENDA' })
  @IsOptional()
  @IsString()
  entidadeTipo?: string;

  @ApiPropertyOptional({ description: 'Id da entidade afetada.' })
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiPropertyOptional({ example: 'ORDEM_VENDA_STATUS_ALTERADO' })
  @IsOptional()
  @IsString()
  acao?: string;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Ocorridos a partir de (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  ocorridoDe?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Ocorridos até (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  ocorridoAte?: string;
}
