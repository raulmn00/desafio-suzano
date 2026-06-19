import { DomainValidationError } from '../../../../shared/domain/domain-error';
import { FakeClock, SequentialIdGenerator } from '../../../../shared/testing/fakes';
import { SkuJaCadastradoError } from '../../domain/item.errors';
import { CriarItemUseCase } from './criar-item.use-case';
import { InMemoryItemRepository } from './testing/in-memory-item.repository';

describe('CriarItemUseCase', () => {
  let repositorio: InMemoryItemRepository;
  let useCase: CriarItemUseCase;

  beforeEach(() => {
    repositorio = new InMemoryItemRepository();
    useCase = new CriarItemUseCase(
      repositorio,
      new SequentialIdGenerator('item'),
      new FakeClock(new Date('2026-06-19T12:00:00.000Z')),
    );
  });

  it('cria um item e o persiste', async () => {
    const view = await useCase.executar({ sku: 'sku-001', descricao: 'Papel A4', unidade: 'CX' });

    expect(view).toMatchObject({
      id: 'item-1',
      sku: 'SKU-001',
      descricao: 'Papel A4',
      unidade: 'CX',
      ativo: true,
    });
    expect(view.criadoEm).toBe('2026-06-19T12:00:00.000Z');
    expect(repositorio.itens.size).toBe(1);
    expect((await repositorio.buscarPorSku('SKU-001'))?.id).toBe('item-1');
  });

  it('rejeita sku já cadastrado', async () => {
    await useCase.executar({ sku: 'SKU-001', descricao: 'Papel A4', unidade: 'CX' });

    await expect(
      useCase.executar({ sku: 'sku-001', descricao: 'Outro', unidade: 'UN' }),
    ).rejects.toBeInstanceOf(SkuJaCadastradoError);
    expect(repositorio.itens.size).toBe(1);
  });

  it('propaga erro de validação de domínio para descrição inválida', async () => {
    await expect(
      useCase.executar({ sku: 'SKU-001', descricao: '   ', unidade: 'CX' }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(repositorio.itens.size).toBe(0);
  });
});
