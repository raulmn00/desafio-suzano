import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class EditarClienteDto {
  @ApiPropertyOptional({ example: 'Acme Logística S.A.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome?: string;

  @ApiPropertyOptional({ example: '11.222.333/0001-81' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  documento?: string;
}
