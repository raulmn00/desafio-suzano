export interface AuditEventProps {
  id: string;
  ocorridoEm: Date;
  ator: string;
  acao: string;
  entidadeTipo: string;
  entidadeId: string;
  estadoAnterior: Record<string, unknown> | null;
  estadoPosterior: Record<string, unknown> | null;
  correlationId: string | null;
}

/**
 * Read model da trilha de auditoria. É append-only: nunca é criado nem editado
 * pelo domínio (a escrita vive no `AuditLogger`), apenas reconstruído para
 * consulta. Imutável por construção.
 */
export class AuditEvent {
  private constructor(private readonly props: AuditEventProps) {}

  static restaurar(props: AuditEventProps): AuditEvent {
    return new AuditEvent(props);
  }

  get id(): string {
    return this.props.id;
  }

  get ocorridoEm(): Date {
    return this.props.ocorridoEm;
  }

  get ator(): string {
    return this.props.ator;
  }

  get acao(): string {
    return this.props.acao;
  }

  get entidadeTipo(): string {
    return this.props.entidadeTipo;
  }

  get entidadeId(): string {
    return this.props.entidadeId;
  }

  get estadoAnterior(): Record<string, unknown> | null {
    return this.props.estadoAnterior;
  }

  get estadoPosterior(): Record<string, unknown> | null {
    return this.props.estadoPosterior;
  }

  get correlationId(): string | null {
    return this.props.correlationId;
  }
}
