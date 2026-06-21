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

  it('retorna todos os eventos sem filtros, apresentados (envelope paginado)', async () => {
    const r = await useCase.executar({});

    expect(r.data).toHaveLength(3);
    expect(r).toMatchObject({ page: 1, limit: 20, total: 3, totalPages: 1 });
    expect(r.data[0]).toMatchObject({ id: 'a1', ocorridoEm: expect.any(String) });
  });

  it('pagina os eventos (skip/take + total)', async () => {
    const p1 = await useCase.executar({}, { page: 1, limit: 2 });
    expect(p1.data).toHaveLength(2);
    expect(p1).toMatchObject({ total: 3, totalPages: 2 });
  });

  it('filtra por entidadeId', async () => {
    const { data } = await useCase.executar({ entidadeId: 'o1' });
    expect(data.map((e) => e.id).sort()).toEqual(['a1', 'a2']);
  });

  it('filtra por ação', async () => {
    const { data } = await useCase.executar({ acao: 'ORDEM_VENDA_CRIADA' });
    expect(data.map((e) => e.id).sort()).toEqual(['a1', 'a3']);
  });

  it('filtra por período', async () => {
    const { data } = await useCase.executar({
      ocorridoDe: new Date('2026-06-12'),
      ocorridoAte: new Date('2026-06-18'),
    });
    expect(data.map((e) => e.id)).toEqual(['a2']);
  });

  it('filtra por entidadeTipo', async () => {
    const { data } = await useCase.executar({ entidadeTipo: 'ORDEM_VENDA' });
    expect(data).toHaveLength(3);
  });
});
