import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it('agora() retorna um Date dentro do intervalo do tempo atual', () => {
    const clock = new SystemClock();

    const antes = Date.now();
    const agora = clock.agora();
    const depois = Date.now();

    expect(agora).toBeInstanceOf(Date);
    expect(agora.getTime()).toBeGreaterThanOrEqual(antes);
    expect(agora.getTime()).toBeLessThanOrEqual(depois);
  });
});
