import { FakeClock } from '../../../../shared/testing/fakes';
import { TipoTransporte } from '../../../tipos-transporte/domain/tipo-transporte.entity';
import { TipoTransporteNaoEncontradoError } from '../../../tipos-transporte/domain/tipo-transporte.errors';
import { InMemoryTipoTransporteRepository } from '../../../tipos-transporte/application/use-cases/testing/in-memory-tipo-transporte.repository';
import { Cliente } from '../../domain/cliente.entity';
import { ClienteNaoEncontradoError } from '../../domain/cliente.errors';
import { AutorizarTipoTransporteUseCase } from './autorizar-tipo-transporte.use-case';
import { DesautorizarTipoTransporteUseCase } from './desautorizar-tipo-transporte.use-case';
import { InMemoryClienteRepository } from './testing/in-memory-cliente.repository';

describe('Autorização de tipo de transporte para cliente', () => {
  let clientes: InMemoryClienteRepository;
  let tipos: InMemoryTipoTransporteRepository;

  beforeEach(async () => {
    clientes = new InMemoryClienteRepository();
    tipos = new InMemoryTipoTransporteRepository();
    await clientes.salvar(
      Cliente.criar({
        id: 'c-1',
        nome: 'Acme',
        documento: '52998224725',
        agora: new Date('2026-06-19'),
      }),
    );
    await tipos.salvar(
      TipoTransporte.criar({
        id: 't-1',
        nome: 'Caminhão',
        codigo: 'CAM',
        agora: new Date('2026-06-19'),
      }),
    );
  });

  describe('autorizar', () => {
    it('autoriza um transporte existente para o cliente', async () => {
      const useCase = new AutorizarTipoTransporteUseCase(clientes, tipos, new FakeClock());

      const view = await useCase.executar({ clienteId: 'c-1', tipoTransporteId: 't-1' });

      expect(view.transportesAutorizados).toContain('t-1');
    });

    it('lança NotFound quando o cliente não existe', async () => {
      const useCase = new AutorizarTipoTransporteUseCase(clientes, tipos, new FakeClock());

      await expect(
        useCase.executar({ clienteId: 'inexistente', tipoTransporteId: 't-1' }),
      ).rejects.toBeInstanceOf(ClienteNaoEncontradoError);
    });

    it('lança erro quando o tipo de transporte não existe', async () => {
      const useCase = new AutorizarTipoTransporteUseCase(clientes, tipos, new FakeClock());

      await expect(
        useCase.executar({ clienteId: 'c-1', tipoTransporteId: 'inexistente' }),
      ).rejects.toBeInstanceOf(TipoTransporteNaoEncontradoError);
    });
  });

  describe('desautorizar', () => {
    it('remove a autorização de um transporte', async () => {
      await new AutorizarTipoTransporteUseCase(clientes, tipos, new FakeClock()).executar({
        clienteId: 'c-1',
        tipoTransporteId: 't-1',
      });

      const view = await new DesautorizarTipoTransporteUseCase(clientes, new FakeClock()).executar({
        clienteId: 'c-1',
        tipoTransporteId: 't-1',
      });

      expect(view.transportesAutorizados).not.toContain('t-1');
    });

    it('lança NotFound quando o cliente não existe', async () => {
      await expect(
        new DesautorizarTipoTransporteUseCase(clientes, new FakeClock()).executar({
          clienteId: 'x',
          tipoTransporteId: 't-1',
        }),
      ).rejects.toBeInstanceOf(ClienteNaoEncontradoError);
    });
  });
});
