import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../../../../shared/infrastructure/http/paginacao.dto';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';

/** Filtros do monitoramento operacional (query string) + paginação. */
export class FiltrosOrdemVendaDto extends PaginacaoDto {
  @ApiPropertyOptional({ enum: StatusOrdemVenda })
  @IsOptional()
  @IsEnum(StatusOrdemVenda)
  status?: StatusOrdemVenda;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoTransporteId?: string;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Criadas a partir de (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  criadoDe?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Criadas até (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  criadoAte?: string;
}
