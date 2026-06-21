import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginOutput, LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import {
  RefreshTokenOutput,
  RefreshTokenUseCase,
} from '../../application/use-cases/refresh-token.use-case';
import { Public } from '../public.decorator';
import { UsuarioAtual } from '../usuario-atual.decorator';
import { UsuarioAutenticado } from '../jwt.strategy';
import { LoginDto } from './login.dto';
import { LogoutDto } from './logout.dto';
import { RefreshDto } from './refresh.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  // Teto estrito anti brute-force (sobrepõe o limite global): 10 tentativas/min por IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica e retorna access token (curto) + refresh token.' })
  login(@Body() dto: LoginDto): Promise<LoginOutput> {
    return this.loginUseCase.executar(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Troca um refresh token válido por um novo par (access + refresh).' })
  refresh(@Body() dto: RefreshDto): Promise<RefreshTokenOutput> {
    return this.refreshTokenUseCase.executar({ refreshToken: dto.refreshToken });
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerra a sessão: revoga o access token atual e o refresh informado.' })
  async logout(@Body() dto: LogoutDto, @UsuarioAtual() usuario: UsuarioAutenticado): Promise<void> {
    await this.logoutUseCase.executar({
      refreshToken: dto.refreshToken,
      jti: usuario.jti,
      accessExpiraEm: usuario.expiraEm,
    });
  }
}
