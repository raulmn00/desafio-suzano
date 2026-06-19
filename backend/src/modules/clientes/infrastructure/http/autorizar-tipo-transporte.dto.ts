import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AutorizarTipoTransporteDto {
  @ApiProperty({ description: 'Id do tipo de transporte a autorizar para o cliente.' })
  @IsString()
  @IsNotEmpty()
  tipoTransporteId!: string;
}
