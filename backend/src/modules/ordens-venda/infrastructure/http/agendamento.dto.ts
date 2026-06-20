import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, Matches } from 'class-validator';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Usado para definir e para reagendar o agendamento de uma OV. */
export class AgendamentoDto {
  @ApiProperty({ example: '2026-06-25', description: 'Data de entrega (ISO 8601).' })
  @IsDateString()
  @IsNotEmpty()
  dataEntrega!: string;

  @ApiProperty({ example: '08:00', description: 'Início da janela de atendimento (HH:mm).' })
  @Matches(HORA, { message: 'janelaInicio deve estar no formato HH:mm.' })
  janelaInicio!: string;

  @ApiProperty({ example: '12:00', description: 'Fim da janela de atendimento (HH:mm).' })
  @Matches(HORA, { message: 'janelaFim deve estar no formato HH:mm.' })
  janelaFim!: string;
}
