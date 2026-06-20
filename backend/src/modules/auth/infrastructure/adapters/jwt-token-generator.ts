import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadToken, TokenGenerator } from '../../application/ports/token-generator';

@Injectable()
export class JwtTokenGenerator extends TokenGenerator {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  gerar(payload: PayloadToken): string {
    return this.jwtService.sign(payload);
  }
}
