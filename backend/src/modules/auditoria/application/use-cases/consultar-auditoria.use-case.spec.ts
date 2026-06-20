import { AuditEvent } from '../../domain/audit-event.entity';
import { ConsultarAuditoriaUseCase } from './consultar-auditoria.use-case';
import { InMemoryAuditEventRepository } from './testing/in-memory-audit-event.repository';

function evento(id: string, acao: string, entidadeId: string, ocorridoEm: Date): AuditEvent {
  return AuditEvent.restaurar({
    id,
    ocorridoEm,
    ator: 'op@ovgs.dev',
    acao,
    entidadeTipo: 'ORDEM_VENDA',
    entidadeId,
    estadoAnterior: null,
    estadoPosterior: { status: 'CRIADA' },
    correlationId: null,
  });
}

describe('ConsultarAuditoriaUseCase', () => {
  let repositorio: InMemoryAuditEventRepository;
  let useCase: ConsultarAuditoriaUseCase;

  beforeEach(() => {
    repositorio = new InMemoryAuditEventRepository();
    repositorio.eventos.push(
      evento('a1', 'ORDEM_VENDA_CRIADA', 'o1', new Date('2026-06-10')),
      evento('a2', 'ORDEM_VENDA_STATUS_ALTERADO', 'o1', new Date('2026-06-15')),
      evento('a3', 'ORDEM_VENDA_CRIADA', 'o2', new Date('2026-06-20')),
    );
    useCase = new ConsultarAuditoriaUseCase(repositorio);
  });

  it('retorna todos os eventos sem filtros, apresentados', async () => {
    const lista = await useCase.executar({});

    expect(lista).toHaveLength(3);
    expect(lista[0]).toMatchObject({ id: 'a1', ocorridoEm: expect.any(String) });
  });

  it('filtra por entidadeId', async () => {
    const lista = await useCase.executar({ entidadeId: 'o1' });
    expect(lista.map((e) => e.id).sort()).toEqual(['a1', 'a2']);
  });

  it('filtra por ação', async () => {
    const lista = await useCase.executar({ acao: 'ORDEM_VENDA_CRIADA' });
    expect(lista.map((e) => e.id).sort()).toEqual(['a1', 'a3']);
  });

  it('filtra por período', async () => {
    const lista = await useCase.executar({
      ocorridoDe: new Date('2026-06-12'),
      ocorridoAte: new Date('2026-06-18'),
    });
    expect(lista.map((e) => e.id)).toEqual(['a2']);
  });

  it('filtra por entidadeTipo', async () => {
    const lista = await useCase.executar({ entidadeTipo: 'ORDEM_VENDA' });
    expect(lista).toHaveLength(3);
  });
});
