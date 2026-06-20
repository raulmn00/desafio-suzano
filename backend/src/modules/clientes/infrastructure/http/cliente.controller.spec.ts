import { AutorizarTipoTransporteUseCase } from '../../application/use-cases/autorizar-tipo-transporte.use-case';
import { ConsultarClientePorIdUseCase } from '../../application/use-cases/consultar-cliente-por-id.use-case';
import { ConsultarClientesUseCase } from '../../application/use-cases/consultar-clientes.use-case';
import { CriarClienteUseCase } from '../../application/use-cases/criar-cliente.use-case';
import { DesautorizarTipoTransporteUseCase } from '../../application/use-cases/desautorizar-tipo-transporte.use-case';
import { EditarClienteUseCase } from '../../application/use-cases/editar-cliente.use-case';
import { ClienteController } from './cliente.controller';

describe('ClienteController', () => {
  const criar = { executar: jest.fn() } as unknown as CriarClienteUseCase;
  const editar = { executar: jest.fn() } as unknown as EditarClienteUseCase;
  const todos = { executar: jest.fn() } as unknown as ConsultarClientesUseCase;
  const porId = { executar: jest.fn() } as unknown as ConsultarClientePorIdUseCase;
  const autorizar = { executar: jest.fn() } as unknown as AutorizarTipoTransporteUseCase;
  const desautorizar = { executar: jest.fn() } as unknown as DesautorizarTipoTransporteUseCase;
  const controller = new ClienteController(criar, editar, todos, porId, autorizar, desautorizar);

  afterEach(() => jest.clearAllMocks());

  it('criar delega o DTO', async () => {
    await controller.criar({ nome: 'Acme', documento: '52998224725' });
    expect(criar.executar).toHaveBeenCalledWith({ nome: 'Acme', documento: '52998224725' });
  });

  it('listar delega', async () => {
    await controller.listar();
    expect(todos.executar).toHaveBeenCalledTimes(1);
  });

  it('obter delega o id', async () => {
    await controller.obter('c-1');
    expect(porId.executar).toHaveBeenCalledWith('c-1');
  });

  it('editar combina id e DTO', async () => {
    await controller.editar('c-1', { nome: 'Novo' });
    expect(editar.executar).toHaveBeenCalledWith({ id: 'c-1', nome: 'Novo' });
  });

  it('autorizar mapeia id e tipoTransporteId', async () => {
    await controller.autorizar('c-1', { tipoTransporteId: 't-1' });
    expect(autorizar.executar).toHaveBeenCalledWith({ clienteId: 'c-1', tipoTransporteId: 't-1' });
  });

  it('desautorizar mapeia os params', async () => {
    await controller.desautorizar('c-1', 't-1');
    expect(desautorizar.executar).toHaveBeenCalledWith({
      clienteId: 'c-1',
      tipoTransporteId: 't-1',
    });
  });
});
