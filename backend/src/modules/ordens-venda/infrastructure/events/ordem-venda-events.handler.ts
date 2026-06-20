import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MetricsService } from '../../../../shared/infrastructure/metrics/metrics.service';
import {
  OrdemVendaCriadaEvent,
  OrdemVendaStatusAlteradoEvent,
} from '../../domain/events/ordem-venda.events';
import { StatusOrdemVenda } from '../../domain/status-ordem-venda';

/**
 * Reage aos eventos de domínio de Ordens de Venda de forma DESACOPLADA dos
 * use-cases: alimenta métricas de negócio e emite uma "notificação" (aqui um log
 * estruturado; em produção seria e-mail/Slack/webhook). Como é in-process e
 * best-effort, não substitui a auditoria transacional.
 */
@Injectable()
export class OrdemVendaEventsHandler {
  private readonly logger = new Logger('OrdemVendaEvents');

  constructor(private readonly metrics: MetricsService) {}

  @OnEvent(OrdemVendaCriadaEvent.NOME)
  aoCriar(evento: OrdemVendaCriadaEvent): void {
    this.metrics.registrarEventoNegocio('criada');
    this.logger.log(`notificação: OV ${evento.ordemId} criada (cliente ${evento.clienteId})`);
  }

  @OnEvent(OrdemVendaStatusAlteradoEvent.NOME)
  aoAlterarStatus(evento: OrdemVendaStatusAlteradoEvent): void {
    this.metrics.registrarEventoNegocio('status_alterado');
    if (evento.para === StatusOrdemVenda.ENTREGUE) {
      this.metrics.registrarEventoNegocio('entregue');
    }
    this.logger.log(`notificação: OV ${evento.ordemId} ${evento.de} → ${evento.para}`);
  }
}
