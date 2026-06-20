import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Refresh token a invalidar (encerra a sessão também para renovação).',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
