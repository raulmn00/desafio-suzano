import { Clock } from '../application/ports/clock';
import { IdGenerator } from '../application/ports/id-generator';
import { TransactionManager } from '../application/ports/transaction-manager';
import { AuditLogger, RegistroAuditoria } from '../application/ports/audit-logger';

/** Relógio determinístico para testes. */
export class FakeClock extends Clock {
  constructor(private data: Date = new Date('2026-06-19T12:00:00.000Z')) {
    super();
  }

  agora(): Date {
    return this.data;
  }

  definir(data: Date): void {
    this.data = data;
  }
}

/** Gerador de IDs previsível (`prefixo-1`, `prefixo-2`, ...). */
export class SequentialIdGenerator extends IdGenerator {
  private contador = 0;

  constructor(private readonly prefixo = 'id') {
    super();
  }

  gerar(): string {
    this.contador += 1;
    return `${this.prefixo}-${this.contador}`;
  }
}

/** Transaction manager que apenas executa o trabalho (sem transação real). */
export class FakeTransactionManager extends TransactionManager {
  executar<T>(trabalho: () => Promise<T>): Promise<T> {
    return trabalho();
  }
}

/** Coletor de auditoria em memória para asserts nos testes. */
export class FakeAuditLogger extends AuditLogger {
  readonly registros: RegistroAuditoria[] = [];

  async registrar(registro: RegistroAuditoria): Promise<void> {
    this.registros.push(registro);
  }
}
