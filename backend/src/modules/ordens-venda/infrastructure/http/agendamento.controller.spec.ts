import { ConfirmarAgendamentoUseCase } from '../../application/use-cases/confirmar-agendamento.use-case';
import { DefinirAgendamentoUseCase } from '../../application/use-cases/definir-agendamento.use-case';
import { ReagendarUseCase } from '../../application/use-cases/reagendar.use-case';
import { AgendamentoController } from './agendamento.controller';

describe('AgendamentoController', () => {
  const definir = { executar: jest.fn() } as unknown as DefinirAgendamentoUseCase;
  const confirmar = { executar: jest.fn() } as unknown as ConfirmarAgendamentoUseCase;
  const reagendar = { executar: jest.fn() } as unknown as ReagendarUseCase;
  const controller = new AgendamentoController(definir, confirmar, reagendar);

  afterEach(() => jest.clearAllMocks());

  it('definir converte a data e repassa os dados', async () => {
    await controller.definir(
      'o1',
      { dataEntrega: '2026-06-25', janelaInicio: '08:00', janelaFim: '12:00' },
      'op',
    );
    expect(definir.executar).toHaveBeenCalledWith({
      id: 'o1',
      dataEntrega: new Date('2026-06-25'),
      janelaInicio: '08:00',
      janelaFim: '12:00',
      ator: 'op',
    });
  });

  it('confirmar repassa id e ator', async () => {
    await controller.confirmar('o1', 'op');
    expect(confirmar.executar).toHaveBeenCalledWith({ id: 'o1', ator: 'op' });
  });

  it('reagendar converte a data e repassa os dados', async () => {
    await controller.reagendar(
      'o1',
      { dataEntrega: '2026-06-26', janelaInicio: '13:00', janelaFim: '17:00' },
      'op',
    );
    expect(reagendar.executar).toHaveBeenCalledWith({
      id: 'o1',
      dataEntrega: new Date('2026-06-26'),
      janelaInicio: '13:00',
      janelaFim: '17:00',
      ator: 'op',
    });
  });
});
