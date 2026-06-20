import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  const health = {
    readiness: jest.fn().mockResolvedValue({ status: 'ready', timestamp: 'x' }),
  } as unknown as HealthService;
  const controller = new HealthController(health);

  it('liveness retorna status ok com timestamp ISO', () => {
    const resposta = controller.verificar();
    expect(resposta.status).toBe('ok');
    expect(new Date(resposta.timestamp).toISOString()).toBe(resposta.timestamp);
  });

  it('readiness delega para o HealthService', async () => {
    await expect(controller.readiness()).resolves.toMatchObject({ status: 'ready' });
    expect(health.readiness).toHaveBeenCalled();
  });
});
