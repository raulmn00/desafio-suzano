import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { criarEventBus } from './events.config';
import { InProcessEventBus } from './in-process-event-bus';
import { RedisStreamEventBus } from './redis-stream-event-bus';

describe('criarEventBus', () => {
  const emitter = { emit: jest.fn() } as unknown as EventEmitter2;

  it('sem REDIS_URL → InProcessEventBus', () => {
    const config = { get: () => undefined } as unknown as ConfigService;
    expect(criarEventBus(config, emitter)).toBeInstanceOf(InProcessEventBus);
  });

  it('com REDIS_URL → RedisStreamEventBus (conexão preguiçosa, não conecta)', () => {
    const config = { get: () => 'redis://localhost:6379' } as unknown as ConfigService;
    expect(criarEventBus(config, emitter)).toBeInstanceOf(RedisStreamEventBus);
  });
});
