import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HashComparer } from './application/ports/hash-comparer';
import { TokenGenerator } from './application/ports/token-generator';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { UsuarioRepository } from './domain/usuario.repository';
import { BcryptHashComparer } from './infrastructure/adapters/bcrypt-hash-comparer';
import { JwtTokenGenerator } from './infrastructure/adapters/jwt-token-generator';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { AuthController } from './infrastructure/http/auth.controller';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PrismaUsuarioRepository } from './infrastructure/persistence/prisma-usuario.repository';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // `expiresIn` aceita "1d", "2h"... mas o tipo do ms exige template literal;
        // o valor vem de env (string) e é validado em runtime.
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '1d',
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: UsuarioRepository, useClass: PrismaUsuarioRepository },
    { provide: HashComparer, useClass: BcryptHashComparer },
    { provide: TokenGenerator, useClass: JwtTokenGenerator },
    {
      provide: LoginUseCase,
      useFactory: (repo: UsuarioRepository, hash: HashComparer, token: TokenGenerator) =>
        new LoginUseCase(repo, hash, token),
      inject: [UsuarioRepository, HashComparer, TokenGenerator],
    },
    JwtStrategy,
    // Guards globais: autentica (JWT) e então autoriza (RBAC).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
