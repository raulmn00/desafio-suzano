import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { OpaqueTokenGenerator } from '../../application/ports/opaque-token-generator';

@Injectable()
export class CryptoOpaqueTokenGenerator extends OpaqueTokenGenerator {
  gerar(): string {
    return randomBytes(48).toString('base64url');
  }
}
