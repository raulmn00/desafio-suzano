import { ConsultarTipoTransportePorIdUseCase } from '../../application/use-cases/consultar-tipo-transporte-por-id.use-case';
import { ConsultarTiposTransporteUseCase } from '../../application/use-cases/consultar-tipos-transporte.use-case';
import { CriarTipoTransporteUseCase } from '../../application/use-cases/criar-tipo-transporte.use-case';
import { EditarTipoTransporteUseCase } from '../../application/use-cases/editar-tipo-transporte.use-case';
import { TipoTransporteController } from './tipo-transporte.controller';

describe('TipoTransporteController', () => {
  const criar = { executar: jest.fn() } as unknown as CriarTipoTransporteUseCase;
  const editar = { executar: jest.fn() } as unknown as EditarTipoTransporteUseCase;
  const consultarTodos = { executar: jest.fn() } as unknown as ConsultarTiposTransporteUseCase;
  const consultarPorId = { executar: jest.fn() } as unknown as ConsultarTipoTransportePorIdUseCase;
  const controller = new TipoTransporteController(criar, editar, consultarTodos, consultarPorId);

  afterEach(() => jest.clearAllMocks());

  it('criar delega para o use-case com o DTO', async () => {
    (criar.executar as jest.Mock).mockResolvedValue({ id: 'tt-1' });

    const resultado = await controller.criar({ nome: 'Caminhão', codigo: 'CAM' });

    expect(criar.executar).toHaveBeenCalledWith({ nome: 'Caminhão', codigo: 'CAM' });
    expect(resultado).toEqual({ id: 'tt-1' });
  });

  it('listar delega para o use-case de consulta', async () => {
    (consultarTodos.executar as jest.Mock).mockResolvedValue([]);

    await controller.listar();

    expect(consultarTodos.executar).toHaveBeenCalledTimes(1);
  });

  it('obter delega passando o id', async () => {
    await controller.obter('tt-1');

    expect(consultarPorId.executar).toHaveBeenCalledWith('tt-1');
  });

  it('editar combina id e DTO', async () => {
    await controller.editar('tt-1', { nome: 'Novo' });

    expect(editar.executar).toHaveBeenCalledWith({ id: 'tt-1', nome: 'Novo' });
  });
});
