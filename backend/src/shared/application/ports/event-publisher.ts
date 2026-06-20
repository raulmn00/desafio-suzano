import { EventoDominio } from '../../domain/evento-dominio';

/**
 * Port de publicação de eventos de domínio. Os use-cases dependem desta
 * abstração (não do mecanismo concreto), o que mantém a aplicação livre de
 * framework e testável com um fake. Implementado por `NestEventPublisher`.
 */
export abstract class EventPublisher {
  abstract publicar(evento: EventoDominio): void;
}
