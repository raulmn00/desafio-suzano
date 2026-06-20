import { Injectable } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { HashComparer } from '../../application/ports/hash-comparer';

@Injectable()
export class BcryptHashComparer extends HashComparer {
  comparar(textoPlano: string, hash: string): Promise<boolean> {
    return compare(textoPlano, hash);
  }
}
