import { ConsultarItemPorIdUseCase } from '../../application/use-cases/consultar-item-por-id.use-case';
import { ConsultarItensUseCase } from '../../application/use-cases/consultar-itens.use-case';
import { CriarItemUseCase } from '../../application/use-cases/criar-item.use-case';
import { ItemController } from './item.controller';

describe('ItemController', () => {
  const criar = { executar: jest.fn() } as unknown as CriarItemUseCase;
  const consultarTodos = { executar: jest.fn() } as unknown as ConsultarItensUseCase;
  const consultarPorId = { executar: jest.fn() } as unknown as ConsultarItemPorIdUseCase;
  const controller = new ItemController(criar, consultarTodos, consultarPorId);

  afterEach(() => jest.clearAllMocks());

  it('criar delega para o use-case com o DTO', async () => {
    (criar.executar as jest.Mock).mockResolvedValue({ id: 'item-1' });

    const resultado = await controller.criar({ sku: 'SKU-001', descricao: 'Papel A4', unidade: 'CX' });

    expect(criar.executar).toHaveBeenCalledWith({ sku: 'SKU-001', descricao: 'Papel A4', unidade: 'CX' });
    expect(resultado).toEqual({ id: 'item-1' });
  });

  it('listar delega para o use-case de consulta', async () => {
    (consultarTodos.executar as jest.Mock).mockResolvedValue([]);

    await controller.listar();

    expect(consultarTodos.executar).toHaveBeenCalledTimes(1);
  });

  it('obter delega passando o id', async () => {
    await controller.obter('item-1');

    expect(consultarPorId.executar).toHaveBeenCalledWith('item-1');
  });
});
