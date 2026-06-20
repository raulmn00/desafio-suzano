import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'operador@ovgs.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'operador123' })
  @IsString()
  @IsNotEmpty()
  senha!: string;
}
