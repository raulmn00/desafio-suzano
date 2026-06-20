import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { formatDateTime } from '../../../lib/format';
import { useAtualizarTipoTransporte, useCriarTipoTransporte, useTiposTransporte } from '../hooks';
import { tipoTransporteFormSchema, type TipoTransporte, type TipoTransporteFormValues } from '../schema';

export function TiposTransportePage() {
  const query = useTiposTransporte();
  const criar = useCriarTipoTransporte();
  const atualizar = useAtualizarTipoTransporte();
  const [editing, setEditing] = useState<TipoTransporte | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="spread">
        <h1>Tipos de Transporte</h1>
        <Button onClick={() => setCreating(true)}>Novo tipo</Button>
      </div>

      <div className="card">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorAlert error={query.error} />
        ) : (
          <Table
            columns={['Nome', 'Código', 'Ativo', 'Criado em', 'Ações']}
            isEmpty={(query.data ?? []).length === 0}
            empty="Nenhum tipo de transporte cadastrado."
          >
            {query.data?.map((t) => (
              <tr key={t.id} data-testid="tipo-row">
                <td>{t.nome}</td>
                <td className="mono">{t.codigo}</td>
                <td>{t.ativo ? 'Sim' : 'Não'}</td>
                <td>{formatDateTime(t.criadoEm)}</td>
                <td>
                  <Button variant="secondary" small onClick={() => setEditing(t)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {creating ? (
        <TipoTransporteForm
          title="Novo tipo de transporte"
          submitLabel="Criar"
          pending={criar.isPending}
          error={criar.error}
          onClose={() => setCreating(false)}
          onSubmit={(values) =>
            criar.mutate(values, {
              onSuccess: () => setCreating(false),
            })
          }
        />
      ) : null}

      {editing ? (
        <TipoTransporteForm
          title="Editar tipo de transporte"
          submitLabel="Salvar"
          pending={atualizar.isPending}
          error={atualizar.error}
          defaultValues={{ nome: editing.nome, codigo: editing.codigo }}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            atualizar.mutate(
              { id: editing.id, values },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      ) : null}
    </div>
  );
}

interface FormProps {
  title: string;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  defaultValues?: TipoTransporteFormValues;
  onClose: () => void;
  onSubmit: (values: TipoTransporteFormValues) => void;
}

function TipoTransporteForm({ title, submitLabel, pending, error, defaultValues, onClose, onSubmit }: FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TipoTransporteFormValues>({
    resolver: zodResolver(tipoTransporteFormSchema),
    defaultValues: defaultValues ?? { nome: '', codigo: '' },
  });

  return (
    <Modal title={title} onClose={onClose}>
      {error ? <ErrorAlert error={error} /> : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Nome" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register('nome')} />
        </Field>
        <Field label="Código" htmlFor="codigo" error={errors.codigo?.message}>
          <Input id="codigo" {...register('codigo')} />
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
