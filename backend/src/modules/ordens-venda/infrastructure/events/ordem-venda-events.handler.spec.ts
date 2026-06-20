import { MetricsService } from '../../../../shared/infrastructure/metrics/metrics.service';
import {
  OrdemVendaCriadaEvent,
  OrdemVendaStatusAlteradoEvent,
} from '../../domain/events/ordem-venda.events';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';
import { OrdemVendaEventsHandler } from './ordem-venda-events.handler';

describe('OrdemVendaEventsHandler', () => {
  function criar() {
    const metrics = { registrarEventoNegocio: jest.fn() } as unknown as MetricsService;
    return { metrics, handler: new OrdemVendaEventsHandler(metrics) };
  }

  it('OV criada → métrica de negócio "criada"', () => {
    const { metrics, handler } = criar();
    handler.aoCriar(new OrdemVendaCriadaEvent('ov1', 'c1', 'op', new Date()));
    expect(metrics.registrarEventoNegocio).toHaveBeenCalledWith('criada');
  });

  it('status alterado (não-entregue) → apenas "status_alterado"', () => {
    const { metrics, handler } = criar();
    handler.aoAlterarStatus(
      new OrdemVendaStatusAlteradoEvent(
        'ov1',
        StatusOrdemVenda.CRIADA,
        StatusOrdemVenda.PLANEJADA,
        'op',
        new Date(),
      ),
    );
    expect(metrics.registrarEventoNegocio).toHaveBeenCalledWith('status_alterado');
    expect(metrics.registrarEventoNegocio).not.toHaveBeenCalledWith('entregue');
  });

  it('status alterado para ENTREGUE → também conta "entregue"', () => {
    const { metrics, handler } = criar();
    handler.aoAlterarStatus(
      new OrdemVendaStatusAlteradoEvent(
        'ov1',
        StatusOrdemVenda.EM_TRANSPORTE,
        StatusOrdemVenda.ENTREGUE,
        'op',
        new Date(),
      ),
    );
    expect(metrics.registrarEventoNegocio).toHaveBeenCalledWith('status_alterado');
    expect(metrics.registrarEventoNegocio).toHaveBeenCalledWith('entregue');
  });
});
