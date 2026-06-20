import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  it('expõe o dump do registry Prometheus', async () => {
    const metrics = {
      coletar: jest.fn().mockResolvedValue('# HELP ...'),
    } as unknown as MetricsService;
    const controller = new MetricsController(metrics);

    await expect(controller.coletar()).resolves.toBe('# HELP ...');
    expect(metrics.coletar).toHaveBeenCalled();
  });
});
