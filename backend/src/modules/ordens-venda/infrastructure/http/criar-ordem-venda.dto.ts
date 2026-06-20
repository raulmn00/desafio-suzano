import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemOrdemVendaDto {
  @ApiProperty({ description: 'Id do item previamente cadastrado.' })
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({ example: 10, description: 'Quantidade (inteiro positivo).' })
  @IsInt()
  @Min(1)
  quantidade!: number;
}

export class CriarOrdemVendaDto {
  @ApiProperty({ description: 'Id do cliente.' })
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @ApiProperty({ description: 'Id do tipo de transporte (deve estar autorizado para o cliente).' })
  @IsString()
  @IsNotEmpty()
  tipoTransporteId!: string;

  @ApiProperty({ type: [ItemOrdemVendaDto], description: 'Itens da ordem (ao menos um).' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemVendaDto)
  itens!: ItemOrdemVendaDto[];
}
