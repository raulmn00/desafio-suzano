import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class EditarTipoTransporteDto {
  @ApiPropertyOptional({ example: 'Caminhão Truck' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome?: string;

  @ApiPropertyOptional({ example: 'TRUCK' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo?: string;
}
