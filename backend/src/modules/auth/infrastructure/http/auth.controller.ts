import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginOutput, LoginUseCase } from '../../application/use-cases/login.use-case';
import { Public } from '../public.decorator';
import { LoginDto } from './login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica e retorna um token JWT.' })
  login(@Body() dto: LoginDto): Promise<LoginOutput> {
    return this.loginUseCase.executar(dto);
  }
}
