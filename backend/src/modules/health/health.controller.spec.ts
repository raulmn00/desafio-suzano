import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('retorna status ok com timestamp ISO', () => {
    const resposta = controller.verificar();

    expect(resposta.status).toBe('ok');
    expect(() => new Date(resposta.timestamp).toISOString()).not.toThrow();
    expect(new Date(resposta.timestamp).toISOString()).toBe(resposta.timestamp);
  });
});
