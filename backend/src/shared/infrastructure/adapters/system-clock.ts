import { Injectable } from '@nestjs/common';
import { Clock } from '../../application/ports/clock';

@Injectable()
export class SystemClock extends Clock {
  agora(): Date {
    return new Date();
  }
}
