import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarTipoTransporteDto {
  @ApiProperty({ example: 'Caminhão', description: 'Nome da modalidade de transporte.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome!: string;

  @ApiProperty({ example: 'CAM', description: 'Código único (normalizado em maiúsculas).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo!: string;
}
