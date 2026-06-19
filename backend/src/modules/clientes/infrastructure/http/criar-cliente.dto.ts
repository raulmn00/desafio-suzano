import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarClienteDto {
  @ApiProperty({ example: 'Acme Logística Ltda' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome!: string;

  @ApiProperty({ example: '11.222.333/0001-81', description: 'CPF ou CNPJ (com ou sem máscara).' })
  @IsString()
  @IsNotEmpty()
  documento!: string;
}
