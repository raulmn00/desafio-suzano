import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { formatDate, toDateInput } from '../../../lib/format';
import { useConfirmarAgendamento, useCriarAgendamento, useReagendar } from '../hooks';
import { agendamentoFormSchema, type AgendamentoFormValues, type OrdemVenda } from '../schema';

export function AgendamentoSection({ ordem }: { ordem: OrdemVenda }) {
  const criar = useCriarAgendamento();
  const reagendar = useReagendar();
  const confirmar = useConfirmarAgendamento();

  const ag = ordem.agendamento;
  const jaTem = Boolean(ag);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgendamentoFormValues>({
    resolver: zodResolver(agendamentoFormSchema),
    values: {
      dataEntrega: toDateInput(ag?.dataEntrega),
      janelaInicio: ag?.janelaInicio ?? '',
      janelaFim: ag?.janelaFim ?? '',
    },
  });

  const mutationError = criar.error ?? reagendar.error ?? confirmar.error;
  const pending = criar.isPending || reagendar.isPending;

  function onSubmit(values: AgendamentoFormValues) {
    const mutation = jaTem ? reagendar : criar;
    mutation.mutate({ id: ordem.id, values });
  }

  return (
    <div className="card" data-testid="agendamento-section">
      <h2>Central de Agendamento</h2>

      {ag ? (
        <div className={`alert ${ag.confirmado ? 'success' : 'info'}`}>
          Agendamento {ag.confirmado ? 'CONFIRMADO' : 'pendente de confirmação'} para{' '}
          <strong>{formatDate(ag.dataEntrega)}</strong>, janela {ag.janelaInicio}–{ag.janelaFim}.
        </div>
      ) : (
        <p className="muted">Nenhum agendamento definido para esta ordem.</p>
      )}

      {mutationError ? <ErrorAlert error={mutationError} /> : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="row">
          <Field label="Data de entrega" htmlFor="dataEntrega" error={errors.dataEntrega?.message}>
            <Input id="dataEntrega" type="date" max="9999-12-31" {...register('dataEntrega')} />
          </Field>
          <Field label="Janela início" htmlFor="janelaInicio" error={errors.janelaInicio?.message}>
            <Input id="janelaInicio" type="time" {...register('janelaInicio')} />
          </Field>
          <Field label="Janela fim" htmlFor="janelaFim" error={errors.janelaFim?.message}>
            <Input id="janelaFim" type="time" {...register('janelaFim')} />
          </Field>
        </div>

        <div className="row">
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : jaTem ? 'Reagendar' : 'Definir agendamento'}
          </Button>
          {jaTem && !ag?.confirmado ? (
            <Button
              type="button"
              variant="secondary"
              disabled={confirmar.isPending}
              onClick={() => confirmar.mutate({ id: ordem.id })}
              data-testid="confirmar-agendamento"
            >
              {confirmar.isPending ? 'Confirmando...' : 'Confirmar agendamento'}
            </Button>
          ) : null}
          {jaTem ? (
            <Button type="button" variant="secondary" onClick={() => reset()}>
              Resetar campos
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
