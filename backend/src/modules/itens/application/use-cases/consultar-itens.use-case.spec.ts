import { Item } from '../../domain/item.entity';
import { ItemNaoEncontradoError } from '../../domain/item.errors';
import { ConsultarItemPorIdUseCase } from './consultar-item-por-id.use-case';
import { ConsultarItensUseCase } from './consultar-itens.use-case';
import { InMemoryItemRepository } from './testing/in-memory-item.repository';

describe('Consultas de Item', () => {
  let repositorio: InMemoryItemRepository;

  beforeEach(async () => {
    repositorio = new InMemoryItemRepository();
    await repositorio.salvar(
      Item.criar({ id: 'item-1', sku: 'SKU-001', descricao: 'Papel A4', unidade: 'CX', agora: new Date('2026-06-19') }),
    );
    await repositorio.salvar(
      Item.criar({ id: 'item-2', sku: 'SKU-002', descricao: 'Caixa', unidade: 'UN', agora: new Date('2026-06-19') }),
    );
  });

  it('lista todos os itens', async () => {
    const useCase = new ConsultarItensUseCase(repositorio);

    const lista = await useCase.executar();

    expect(lista).toHaveLength(2);
    expect(lista.map((i) => i.sku)).toEqual(expect.arrayContaining(['SKU-001', 'SKU-002']));
  });

  it('consulta um item por id', async () => {
    const useCase = new ConsultarItemPorIdUseCase(repositorio);

    const view = await useCase.executar('item-1');

    expect(view.descricao).toBe('Papel A4');
  });

  it('lança NotFound ao consultar id inexistente', async () => {
    const useCase = new ConsultarItemPorIdUseCase(repositorio);

    await expect(useCase.executar('inexistente')).rejects.toBeInstanceOf(ItemNaoEncontradoError);
  });

  it('buscarVariosPorIds retorna apenas os itens encontrados', async () => {
    const encontrados = await repositorio.buscarVariosPorIds(['item-1', 'inexistente', 'item-2']);

    expect(encontrados).toHaveLength(2);
    expect(encontrados.map((i) => i.id)).toEqual(expect.arrayContaining(['item-1', 'item-2']));
  });

  it('existePorId reflete a presença do item', async () => {
    expect(await repositorio.existePorId('item-1')).toBe(true);
    expect(await repositorio.existePorId('inexistente')).toBe(false);
  });
});
