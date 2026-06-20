import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AlterarTransporteDto {
  @ApiProperty({ description: 'Novo tipo de transporte (deve estar autorizado para o cliente).' })
  @IsString()
  @IsNotEmpty()
  tipoTransporteId!: string;
}
