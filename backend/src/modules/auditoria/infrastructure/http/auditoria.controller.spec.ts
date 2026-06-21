import { ConsultarAuditoriaUseCase } from '../../application/use-cases/consultar-auditoria.use-case';
import { AuditoriaController } from './auditoria.controller';

describe('AuditoriaController', () => {
  const consultar = { executar: jest.fn() } as unknown as ConsultarAuditoriaUseCase;
  const controller = new AuditoriaController(consultar);

  afterEach(() => jest.clearAllMocks());

  it('converte datas, repassa filtros e paginação', async () => {
    await controller.consultar({
      entidadeTipo: 'ORDEM_VENDA',
      entidadeId: 'o1',
      acao: 'ORDEM_VENDA_CRIADA',
      ocorridoDe: '2026-06-01',
      ocorridoAte: '2026-06-30',
      page: 4,
      limit: 25,
    });

    expect(consultar.executar).toHaveBeenCalledWith(
      {
        entidadeTipo: 'ORDEM_VENDA',
        entidadeId: 'o1',
        acao: 'ORDEM_VENDA_CRIADA',
        ocorridoDe: new Date('2026-06-01'),
        ocorridoAte: new Date('2026-06-30'),
      },
      { page: 4, limit: 25 },
    );
  });

  it('envia datas undefined e paginação default quando ausentes', async () => {
    await controller.consultar({});

    expect(consultar.executar).toHaveBeenCalledWith(
      {
        entidadeTipo: undefined,
        entidadeId: undefined,
        acao: undefined,
        ocorridoDe: undefined,
        ocorridoAte: undefined,
      },
      { page: 1, limit: 20 },
    );
  });
});
