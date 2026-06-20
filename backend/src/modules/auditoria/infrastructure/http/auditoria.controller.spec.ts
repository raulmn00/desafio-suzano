import { ConsultarAuditoriaUseCase } from '../../application/use-cases/consultar-auditoria.use-case';
import { AuditoriaController } from './auditoria.controller';

describe('AuditoriaController', () => {
  const consultar = { executar: jest.fn() } as unknown as ConsultarAuditoriaUseCase;
  const controller = new AuditoriaController(consultar);

  afterEach(() => jest.clearAllMocks());

  it('converte datas e repassa filtros', async () => {
    await controller.consultar({
      entidadeTipo: 'ORDEM_VENDA',
      entidadeId: 'o1',
      acao: 'ORDEM_VENDA_CRIADA',
      ocorridoDe: '2026-06-01',
      ocorridoAte: '2026-06-30',
    });

    expect(consultar.executar).toHaveBeenCalledWith({
      entidadeTipo: 'ORDEM_VENDA',
      entidadeId: 'o1',
      acao: 'ORDEM_VENDA_CRIADA',
      ocorridoDe: new Date('2026-06-01'),
      ocorridoAte: new Date('2026-06-30'),
    });
  });

  it('envia datas undefined quando ausentes', async () => {
    await controller.consultar({});

    expect(consultar.executar).toHaveBeenCalledWith({
      entidadeTipo: undefined,
      entidadeId: undefined,
      acao: undefined,
      ocorridoDe: undefined,
      ocorridoAte: undefined,
    });
  });
});
