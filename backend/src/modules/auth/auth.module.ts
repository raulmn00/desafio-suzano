import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Clock } from '../../shared/application/ports/clock';
import { IdGenerator } from '../../shared/application/ports/id-generator';
import { parseDuracaoMs } from '../../shared/infrastructure/config/parse-duracao';
import { HashComparer } from './application/ports/hash-comparer';
import { OpaqueTokenGenerator } from './application/ports/opaque-token-generator';
import { TokenGenerator } from './application/ports/token-generator';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { AccessTokenDenylistRepository } from './domain/access-token-denylist.repository';
import { RefreshTokenRepository } from './domain/refresh-token.repository';
import { UsuarioRepository } from './domain/usuario.repository';
import { BcryptHashComparer } from './infrastructure/adapters/bcrypt-hash-comparer';
import { CryptoOpaqueTokenGenerator } from './infrastructure/adapters/crypto-opaque-token-generator';
import { JwtTokenGenerator } from './infrastructure/adapters/jwt-token-generator';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { AuthController } from './infrastructure/http/auth.controller';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PrismaAccessTokenDenylistRepository } from './infrastructure/persistence/prisma-access-token-denylist.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { PrismaUsuarioRepository } from './infrastructure/persistence/prisma-usuario.repository';

const refreshTtlMs = (config: ConfigService): number =>
  parseDuracaoMs(config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d');

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Access token CURTO. `expiresIn` aceita "15m", "1h"...; o tipo do ms exige
        // template literal, mas o valor vem de env (string) e é validado em runtime.
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: UsuarioRepository, useClass: PrismaUsuarioRepository },
    { provide: RefreshTokenRepository, useClass: PrismaRefreshTokenRepository },
    { provide: AccessTokenDenylistRepository, useClass: PrismaAccessTokenDenylistRepository },
    { provide: HashComparer, useClass: BcryptHashComparer },
    { provide: TokenGenerator, useClass: JwtTokenGenerator },
    { provide: OpaqueTokenGenerator, useClass: CryptoOpaqueTokenGenerator },
    {
      provide: LoginUseCase,
      useFactory: (
        repo: UsuarioRepository,
        hash: HashComparer,
        token: TokenGenerator,
        refresh: RefreshTokenRepository,
        opaque: OpaqueTokenGenerator,
        id: IdGenerator,
        clock: Clock,
        config: ConfigService,
      ) => new LoginUseCase(repo, hash, token, refresh, opaque, id, clock, refreshTtlMs(config)),
      inject: [
        UsuarioRepository,
        HashComparer,
        TokenGenerator,
        RefreshTokenRepository,
        OpaqueTokenGenerator,
        IdGenerator,
        Clock,
        ConfigService,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        refresh: RefreshTokenRepository,
        repo: UsuarioRepository,
        token: TokenGenerator,
        opaque: OpaqueTokenGenerator,
        id: IdGenerator,
        clock: Clock,
        config: ConfigService,
      ) => new RefreshTokenUseCase(refresh, repo, token, opaque, id, clock, refreshTtlMs(config)),
      inject: [
        RefreshTokenRepository,
        UsuarioRepository,
        TokenGenerator,
        OpaqueTokenGenerator,
        IdGenerator,
        Clock,
        ConfigService,
      ],
    },
    {
      provide: LogoutUseCase,
      useFactory: (refresh: RefreshTokenRepository, denylist: AccessTokenDenylistRepository) =>
        new LogoutUseCase(refresh, denylist),
      inject: [RefreshTokenRepository, AccessTokenDenylistRepository],
    },
    JwtStrategy,
    // Guards globais: autentica (JWT) e então autoriza (RBAC).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
