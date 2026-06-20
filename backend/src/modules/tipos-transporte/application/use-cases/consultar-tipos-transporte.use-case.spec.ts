import { TipoTransporte } from '../../domain/tipo-transporte.entity';
import { TipoTransporteNaoEncontradoError } from '../../domain/tipo-transporte.errors';
import { ConsultarTipoTransportePorIdUseCase } from './consultar-tipo-transporte-por-id.use-case';
import { ConsultarTiposTransporteUseCase } from './consultar-tipos-transporte.use-case';
import { InMemoryTipoTransporteRepository } from './testing/in-memory-tipo-transporte.repository';

describe('Consultas de TipoTransporte', () => {
  let repositorio: InMemoryTipoTransporteRepository;

  beforeEach(async () => {
    repositorio = new InMemoryTipoTransporteRepository();
    await repositorio.salvar(
      TipoTransporte.criar({
        id: 'tt-1',
        nome: 'Caminhão',
        codigo: 'CAM',
        agora: new Date('2026-06-19'),
      }),
    );
    await repositorio.salvar(
      TipoTransporte.criar({
        id: 'tt-2',
        nome: 'Carreta',
        codigo: 'CAR',
        agora: new Date('2026-06-19'),
      }),
    );
  });

  it('lista todos os tipos de transporte', async () => {
    const useCase = new ConsultarTiposTransporteUseCase(repositorio);

    const lista = await useCase.executar();

    expect(lista).toHaveLength(2);
    expect(lista.map((t) => t.codigo)).toEqual(expect.arrayContaining(['CAM', 'CAR']));
  });

  it('consulta um tipo por id', async () => {
    const useCase = new ConsultarTipoTransportePorIdUseCase(repositorio);

    const view = await useCase.executar('tt-1');

    expect(view.nome).toBe('Caminhão');
  });

  it('lança NotFound ao consultar id inexistente', async () => {
    const useCase = new ConsultarTipoTransportePorIdUseCase(repositorio);

    await expect(useCase.executar('inexistente')).rejects.toBeInstanceOf(
      TipoTransporteNaoEncontradoError,
    );
  });
});
