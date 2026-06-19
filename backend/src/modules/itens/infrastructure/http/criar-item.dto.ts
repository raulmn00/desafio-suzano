import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarItemDto {
  @ApiProperty({ example: 'SKU-001', description: 'Identificador único (normalizado em maiúsculas).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  sku!: string;

  @ApiProperty({ example: 'Papel A4 75g', description: 'Descrição do item.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  descricao!: string;

  @ApiProperty({ example: 'CX', description: 'Unidade de medida do item.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidade!: string;
}
