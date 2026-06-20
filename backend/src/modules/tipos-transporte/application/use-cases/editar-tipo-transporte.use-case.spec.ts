import { FakeClock, SequentialIdGenerator } from '../../../../shared/testing/fakes';
import { TipoTransporte } from '../../domain/tipo-transporte.entity';
import {
  CodigoTransporteJaCadastradoError,
  TipoTransporteNaoEncontradoError,
} from '../../domain/tipo-transporte.errors';
import { EditarTipoTransporteUseCase } from './editar-tipo-transporte.use-case';
import { InMemoryTipoTransporteRepository } from './testing/in-memory-tipo-transporte.repository';

describe('EditarTipoTransporteUseCase', () => {
  let repositorio: InMemoryTipoTransporteRepository;
  let useCase: EditarTipoTransporteUseCase;
  const clock = new FakeClock(new Date('2026-06-20T12:00:00.000Z'));
  const ids = new SequentialIdGenerator('tt');

  beforeEach(async () => {
    repositorio = new InMemoryTipoTransporteRepository();
    useCase = new EditarTipoTransporteUseCase(repositorio, clock);
    await repositorio.salvar(
      TipoTransporte.criar({
        id: 'tt-1',
        nome: 'Caminhão',
        codigo: 'CAM',
        agora: new Date('2026-06-19'),
      }),
    );
    void ids;
  });

  it('edita nome e código de um tipo existente', async () => {
    const view = await useCase.executar({ id: 'tt-1', nome: 'Caminhão Truck', codigo: 'truck' });

    expect(view.nome).toBe('Caminhão Truck');
    expect(view.codigo).toBe('TRUCK');
  });

  it('mantém o mesmo código sem acusar conflito', async () => {
    const view = await useCase.executar({ id: 'tt-1', codigo: 'cam' });

    expect(view.codigo).toBe('CAM');
  });

  it('lança NotFound quando o id não existe', async () => {
    await expect(useCase.executar({ id: 'inexistente', nome: 'X' })).rejects.toBeInstanceOf(
      TipoTransporteNaoEncontradoError,
    );
  });

  it('lança conflito quando o novo código já pertence a outro tipo', async () => {
    await repositorio.salvar(
      TipoTransporte.criar({
        id: 'tt-2',
        nome: 'Carreta',
        codigo: 'CAR',
        agora: new Date('2026-06-19'),
      }),
    );

    await expect(useCase.executar({ id: 'tt-1', codigo: 'CAR' })).rejects.toBeInstanceOf(
      CodigoTransporteJaCadastradoError,
    );
  });
});
